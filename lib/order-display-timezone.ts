/**
 * IANA timezone used when filtering the customer order display to "today".
 * Set `ORDER_DISPLAY_TIMEZONE` (e.g. Europe/Dublin) so token numbers align with
 * the restaurant's calendar day. Invalid values fall back to UTC.
 */
const TZ_PATTERN = /^[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+)*$/;

export function getOrderDisplayTimezone(): string {
  const raw = process.env.ORDER_DISPLAY_TIMEZONE?.trim();
  if (!raw || !TZ_PATTERN.test(raw)) return 'UTC';
  return raw;
}
