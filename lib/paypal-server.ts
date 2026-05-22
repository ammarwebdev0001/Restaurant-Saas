type PayPalConfigValidation =
  | { ok: true; clientId: string; clientSecret: string; baseUrl: string }
  | { ok: false; reason: string };

export type PayPalOrderMetadata = {
  plan?: string;
  restaurantId?: string;
  userId?: string;
  userEmail?: string;
  orderId?: string;
  source?: string;
  intentId?: string;
  restaurantSlug?: string;
  orderType?: string;
  fulfillment?: string;
};

function validatePayPalConfig(): PayPalConfigValidation {
  const mode = (process.env.PAYPAL_MODE ?? 'sandbox').trim().toLowerCase();
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId) return { ok: false, reason: 'PAYPAL_CLIENT_ID is not set' };
  if (!clientSecret) return { ok: false, reason: 'PAYPAL_CLIENT_SECRET is not set' };
  const baseUrl =
    process.env.PAYPAL_API_BASE?.trim() ||
    (mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com');
  return { ok: true, clientId, clientSecret, baseUrl };
}

export function isPayPalConfigured(): boolean {
  return validatePayPalConfig().ok;
}

export function getPayPalConfigError(): string | null {
  const v = validatePayPalConfig();
  return v.ok ? null : v.reason;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getPayPalAccessToken(): Promise<string> {
  const validated = validatePayPalConfig();
  if (!validated.ok) throw new Error(validated.reason);

  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const auth = Buffer.from(
    `${validated.clientId}:${validated.clientSecret}`,
    'utf8'
  ).toString('base64');
  const res = await fetch(`${validated.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PayPal auth failed (${res.status}): ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) throw new Error('PayPal did not return access_token');
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + (Number(json.expires_in) || 300) * 1000,
  };
  return json.access_token;
}

function metadataToCustomId(metadata: PayPalOrderMetadata): string {
  // Keep compact. custom_id max length on PayPal is limited.
  return JSON.stringify(metadata).slice(0, 120);
}

function customIdToMetadata(raw: string | null | undefined): PayPalOrderMetadata {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as PayPalOrderMetadata;
  } catch {
    return {};
  }
}

export async function createPayPalOrder(params: {
  amount: number;
  currency: string;
  title: string;
  returnUrl: string;
  cancelUrl: string;
  metadata?: PayPalOrderMetadata;
}) {
  const validated = validatePayPalConfig();
  if (!validated.ok) throw new Error(validated.reason);
  const token = await getPayPalAccessToken();

  const res = await fetch(`${validated.baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: 'default',
          description: params.title.slice(0, 127),
          custom_id: metadataToCustomId(params.metadata ?? {}),
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: params.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        landing_page: 'NO_PREFERENCE',
      },
    }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PayPal order create failed (${res.status}): ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as {
    id: string;
    links?: Array<{ rel?: string; href?: string }>;
  };
  const approveUrl =
    json.links?.find((l) => l.rel === 'approve')?.href ??
    json.links?.find((l) => l.rel === 'payer-action')?.href;
  if (!json.id || !approveUrl) throw new Error('PayPal approval link missing');
  return { id: json.id, url: approveUrl };
}

export async function capturePayPalOrder(orderId: string) {
  const validated = validatePayPalConfig();
  if (!validated.ok) throw new Error(validated.reason);
  const token = await getPayPalAccessToken();
  const res = await fetch(
    `${validated.baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: '{}',
      cache: 'no-store',
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PayPal capture failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return (await res.json()) as {
    id: string;
    status?: string;
    purchase_units?: Array<{
      custom_id?: string;
      payments?: {
        captures?: Array<{
          id?: string;
          status?: string;
          amount?: { value?: string; currency_code?: string };
        }>;
      };
    }>;
  };
}

export async function getPayPalOrder(orderId: string) {
  const validated = validatePayPalConfig();
  if (!validated.ok) throw new Error(validated.reason);
  const token = await getPayPalAccessToken();
  const res = await fetch(
    `${validated.baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PayPal order fetch failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return (await res.json()) as {
    id: string;
    status?: string;
    purchase_units?: Array<{ custom_id?: string }>;
  };
}

export function parsePayPalCustomId(raw: string | null | undefined) {
  return customIdToMetadata(raw);
}