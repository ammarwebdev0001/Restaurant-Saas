const DATA_URL_PREFIX_RE = /^data:image\/(?:png|jpe?g|webp|gif);base64,/i;

export function isDataImageUrl(value: string): boolean {
  return DATA_URL_PREFIX_RE.test(value.trim());
}

export function isHttpImageUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isAcceptedImageValue(value: string): boolean {
  const t = value.trim();
  if (!t) return true;
  return isHttpImageUrl(t) || isDataImageUrl(t);
}

export function estimateDataUrlBytes(value: string): number {
  const t = value.trim();
  const commaIdx = t.indexOf(',');
  if (commaIdx <= 0) return 0;
  const b64 = t.slice(commaIdx + 1).replace(/\s+/g, '');
  const padding = (b64.match(/=+$/)?.[0].length ?? 0);
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding);
}
