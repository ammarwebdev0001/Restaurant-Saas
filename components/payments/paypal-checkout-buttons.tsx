'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { AcceptedPaymentMethods } from '@/components/payments/accepted-payment-methods';

declare global {
  interface Window {
    paypal?: any;
  }
}

type PayPalCaptureResponse = {
  paid?: boolean;
  status?: string;
  orderSync?: 'skipped' | 'completed' | 'already_completed';
  orderId?: string;
  shortOrderId?: string;
  ticketNumber?: number | null;
  restaurantId?: string;
  planSynced?: boolean;
  metadata?: Record<string, unknown>;
  error?: unknown;
};

export type PayPalCheckoutMetadata = Record<string, string>;

export type PayPalCheckoutButtonsProps = {
  amount: number;
  currency?: string;
  title: string;
  source?: 'online' | 'kiosk' | 'subscription';
  endpoint?: '/api/customer/orders' | '/api/kiosk/orders';
  payload?: unknown;
  metadata?: PayPalCheckoutMetadata;
  disabled?: boolean;
  onApproved: (info: {
    paypalOrderId: string;
    capture: PayPalCaptureResponse;
  }) => void;
  onError?: (message: string) => void;
  onCancel?: () => void;
};

type PayPalSdkConfig = {
  clientId: string;
  currency: string;
  mode: 'live' | 'sandbox';
};

let cachedConfig: PayPalSdkConfig | null = null;
let configPromise: Promise<PayPalSdkConfig> | null = null;

async function fetchPayPalConfig(): Promise<PayPalSdkConfig> {
  if (cachedConfig) return cachedConfig;
  if (configPromise) return configPromise;
  configPromise = fetch('/api/paypal/sdk-config', { cache: 'no-store' })
    .then(async (res) => {
      const body = (await res.json().catch(() => ({}))) as {
        clientId?: string;
        currency?: string;
        mode?: string;
        error?: unknown;
      };
      if (!res.ok || !body.clientId) {
        throw new Error(
          typeof body.error === 'string'
            ? body.error
            : 'PayPal is not configured.'
        );
      }
      cachedConfig = {
        clientId: body.clientId,
        currency: (body.currency ?? 'EUR').toUpperCase(),
        mode: body.mode === 'live' ? 'live' : 'sandbox',
      };
      return cachedConfig;
    })
    .catch((e) => {
      configPromise = null;
      throw e;
    });
  return configPromise;
}

const sdkPromises = new Map<string, Promise<void>>();

function loadPayPalSdk(clientId: string, currency: string): Promise<void> {
  const key = `${clientId}:${currency}`;
  const existing = sdkPromises.get(key);
  if (existing) return existing;
  const p = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('PayPal SDK can only load in the browser.'));
      return;
    }
    if (window.paypal) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    const params = new URLSearchParams({
      'client-id': clientId,
      currency,
      components: 'buttons',
      'enable-funding': 'card',
      'disable-funding': 'paylater,credit',
      intent: 'capture',
    });
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.dataset.paypalSdk = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PayPal SDK.'));
    document.head.appendChild(script);
  });
  sdkPromises.set(key, p);
  return p;
}

/**
 * Renders inline **PayPal** and **Debit or Credit Card** buttons (Visa /
 * Mastercard / Amex via PayPal Guest Checkout). On success the captured
 * server response is forwarded to `onApproved` so the caller can route the
 * user, clear local cart state, etc.
 */
export function PayPalCheckoutButtons({
  amount,
  currency,
  title,
  source,
  endpoint,
  payload,
  metadata,
  disabled,
  onApproved,
  onError,
  onCancel,
}: PayPalCheckoutButtonsProps) {
  const paypalSlotRef = useRef<HTMLDivElement>(null);
  const cardSlotRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedCurrency, setResolvedCurrency] = useState<string>(
    (currency ?? 'EUR').toUpperCase()
  );

  // Stable JSON keys so the effect doesn't reinitialize every render.
  const metadataKey = useMemo(() => JSON.stringify(metadata ?? {}), [metadata]);
  const payloadKey = useMemo(() => JSON.stringify(payload ?? null), [payload]);

  // Keep latest values in refs so the SDK callbacks see fresh data
  // without re-rendering buttons each time props change.
  const latestRef = useRef({
    amount,
    currency: resolvedCurrency,
    title,
    source,
    endpoint,
    payload,
    metadata,
    onApproved,
    onError,
    onCancel,
  });
  latestRef.current = {
    amount,
    currency: resolvedCurrency,
    title,
    source,
    endpoint,
    payload,
    metadata,
    onApproved,
    onError,
    onCancel,
  };

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const config = await fetchPayPalConfig();
        if (!config) throw new Error('Missing PayPal configuration.');
        const wantedCurrency = (currency ?? config.currency).toUpperCase();
        await loadPayPalSdk(config.clientId, wantedCurrency);
        if (cancelled) return;
        setResolvedCurrency(wantedCurrency);
        setReady(true);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'PayPal failed to load.';
        setError(msg);
        onError?.(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currency, onError]);

  useEffect(() => {
    if (!ready) return;
    if (typeof window === 'undefined') return;
    const paypal = window.paypal;
    if (!paypal) return;

    const paypalSlot = paypalSlotRef.current;
    const cardSlot = cardSlotRef.current;
    if (paypalSlot) paypalSlot.innerHTML = '';
    if (cardSlot) cardSlot.innerHTML = '';

    const createOrder = async () => {
      const {
        amount: latestAmount,
        currency: latestCurrency,
        title: latestTitle,
        source: latestSource,
        endpoint: latestEndpoint,
        payload: latestPayload,
        metadata: latestMetadata,
      } = latestRef.current;
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: latestAmount,
          currency: latestCurrency,
          source: latestSource,
          title: latestTitle,
          metadata: latestMetadata,
          ...(latestEndpoint && latestPayload != null
            ? { endpoint: latestEndpoint, payload: latestPayload }
            : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: unknown;
      };
      if (!res.ok || !body.id) {
        throw new Error(
          typeof body.error === 'string'
            ? body.error
            : 'Could not start PayPal payment.'
        );
      }
      return body.id;
    };

    const onApprove = async (data: { orderID: string }) => {
      const res = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.orderID }),
      });
      const body = (await res.json().catch(() => ({}))) as PayPalCaptureResponse;
      if (!res.ok || !body.paid) {
        throw new Error(
          typeof body.error === 'string'
            ? body.error
            : 'Payment could not be confirmed.'
        );
      }
      latestRef.current.onApproved({
        paypalOrderId: data.orderID,
        capture: body,
      });
    };

    const handleError = (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Payment failed.';
      setError(msg);
      latestRef.current.onError?.(msg);
    };

    const renderButton = (fundingSource: string, slot: HTMLDivElement | null, label: 'paypal' | 'pay') => {
      if (!slot) return;
      const btn = paypal.Buttons({
        fundingSource,
        style: {
          layout: 'vertical',
          shape: 'rect',
          label,
          height: 44,
          color: label === 'paypal' ? 'gold' : 'black',
        },
        createOrder,
        onApprove,
        onError: handleError,
        onCancel: () => {
          latestRef.current.onCancel?.();
        },
      });
      if (btn.isEligible()) {
        btn.render(slot).catch(handleError);
      }
    };

    renderButton(paypal.FUNDING.PAYPAL, paypalSlot, 'paypal');
    renderButton(paypal.FUNDING.CARD, cardSlot, 'pay');

    return () => {
      if (paypalSlot) paypalSlot.innerHTML = '';
      if (cardSlot) cardSlot.innerHTML = '';
    };
  }, [ready, resolvedCurrency]);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      aria-busy={!ready}
    >
      {!ready ? (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
          Loading payment options…
        </div>
      ) : null}
      <div ref={paypalSlotRef} className="min-h-[44px]" />
      <div ref={cardSlotRef} className="min-h-[44px]" />
      <AcceptedPaymentMethods
        size="sm"
        showPayPal
        showLabel
        label="Pay with PayPal or card"
        className="pt-1"
      />
    </div>
  );
}
