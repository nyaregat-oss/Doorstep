export function parseStartingPrice(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const price = Number(normalized);
  return Number.isFinite(price) && price <= 9999999999.99 ? price : null;
}

export function isCurrencyCode(value: unknown) {
  return typeof value === 'string' && /^[A-Z]{3}$/.test(value);
}
