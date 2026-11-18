export function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

export function isValidEmail(value: unknown) {
  const email = normalizeEmail(value);
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function safeInternalPath(value: unknown, baseOrigin: string) {
  if (typeof value !== 'string' || !value) return '/';
  try {
    const base = new URL(baseOrigin);
    const target = new URL(value, base);
    if (target.origin !== base.origin) return '/';
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return '/';
  }
}
