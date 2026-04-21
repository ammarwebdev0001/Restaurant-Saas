import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

type StripeSecretKeyValidation =
  | { ok: true; key: string }
  | { ok: false; reason: string };

function validateStripeSecretKey(raw: string | undefined): StripeSecretKeyValidation {
  const key = raw?.trim();
  if (!key) {
    return { ok: false, reason: 'STRIPE_SECRET_KEY is not set' };
  }
  if (key.startsWith('pk_')) {
    return {
      ok: false,
      reason:
        'STRIPE_SECRET_KEY is a publishable key (pk_*). Use your secret key (sk_test_* or sk_live_*).',
    };
  }
  if (!key.startsWith('sk_')) {
    return {
      ok: false,
      reason:
        'STRIPE_SECRET_KEY must start with sk_. Set sk_test_* for test mode or sk_live_* for live mode.',
    };
  }
  return { ok: true, key };
}

export function isStripeConfigured(): boolean {
  return validateStripeSecretKey(process.env.STRIPE_SECRET_KEY).ok;
}

export function getStripeConfigError(): string | null {
  const v = validateStripeSecretKey(process.env.STRIPE_SECRET_KEY);
  return v.ok ? null : v.reason;
}

export function getStripe(): Stripe {
  const validated = validateStripeSecretKey(process.env.STRIPE_SECRET_KEY);
  if (!validated.ok) {
    throw new Error(validated.reason);
  }
  if (!stripeClient) {
    stripeClient = new Stripe(validated.key);
  }
  return stripeClient;
}

/** Lowercase ISO currency for Checkout (default EUR to match catalog UI). */
export function getStripeCurrency(): string {
  return (process.env.STRIPE_CURRENCY ?? 'eur').trim().toLowerCase() || 'eur';
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
]);

export function isZeroDecimalCurrency(currency: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.has(currency.trim().toLowerCase());
}

/** Convert catalog major-unit price to Stripe `unit_amount` (smallest currency unit). */
export function toStripeUnitAmount(majorUnits: number, currency: string): number {
  const c = currency.trim().toLowerCase();
  if (!Number.isFinite(majorUnits) || majorUnits < 0) return 0;
  if (isZeroDecimalCurrency(c)) return Math.round(majorUnits);
  return Math.round(majorUnits * 100);
}

export function fromStripeUnitAmount(
  amount: number | null | undefined,
  currency: string
): number {
  if (amount == null || !Number.isFinite(amount)) return 0;
  const c = currency.trim().toLowerCase();
  if (isZeroDecimalCurrency(c)) return amount;
  return amount / 100;
}

/**
 * Practical minimums for Checkout to avoid `amount_too_small` errors.
 * Stripe account/payment-method combinations can require higher equivalent than 0.50 in local currency.
 */
export function minimumCheckoutAmountMajor(currency: string): number {
  const c = currency.trim().toLowerCase();
  const fromEnv = Number(process.env.STRIPE_MIN_CHECKOUT_AMOUNT ?? '');
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;

  // Generic fallback: 0.50 major units (works for EUR).
  return 0.5;
}

/**
 * Checkout payment method types. PayPal must be enabled on your Stripe account
 * (Dashboard → Settings → Payment methods). Comma-separated env, e.g. `card,link,paypal`.
 */
export function checkoutPaymentMethodTypes(): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const raw = process.env.STRIPE_CHECKOUT_METHODS?.trim();
  const parts = raw
    ? raw.split(',').map((s) => s.trim().toLowerCase())
    : ['card', 'link', 'paypal'];
  const allowed = new Set([
    'card',
    'link',
    'paypal',
    'amazon_pay',
    'cashapp',
    'us_bank_account',
    'customer_balance',
  ]);
  const out = parts.filter((p) => allowed.has(p)) as Stripe.Checkout.SessionCreateParams.PaymentMethodType[];
  return out.length > 0 ? out : ['card', 'link'];
}
