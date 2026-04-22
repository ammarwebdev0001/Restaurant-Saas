import { KioskPaymentSuccess } from '@/components/kiosk/kiosk-payment-success';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function pick(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string {
  const v = sp[key];
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

export default async function KioskSuccessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const orderId = pick(sp, 'orderId').trim() || null;
  const sessionId = pick(sp, 'session_id').trim() || null;
  const ticketRaw = pick(sp, 'ticket').trim();
  const ticketFromQuery = ticketRaw ? Number(ticketRaw) : null;
  return (
    <KioskPaymentSuccess
      slug={decodeURIComponent(slug)}
      orderId={orderId}
      sessionId={sessionId}
      ticketFromQuery={Number.isFinite(ticketFromQuery) ? ticketFromQuery : null}
    />
  );
}
