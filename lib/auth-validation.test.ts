import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail, safeInternalPath } from './auth-validation';

describe('auth input validation', () => {
  it('normalizes and validates email addresses', () => {
    expect(normalizeEmail('  USER@Example.co.ke ')).toBe('user@example.co.ke');
    expect(isValidEmail('user@example.co.ke')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a'.repeat(250) + '@example.com')).toBe(false);
  });

  it('accepts only same-origin callback destinations', () => {
    expect(safeInternalPath('/dashboard/provider?welcome=1', 'https://doorstep.example')).toBe('/dashboard/provider?welcome=1');
    expect(safeInternalPath('//attacker.example/path', 'https://doorstep.example')).toBe('/');
    expect(safeInternalPath('/\\\\attacker.example/path', 'https://doorstep.example')).toBe('/');
    expect(safeInternalPath('https://attacker.example/path', 'https://doorstep.example')).toBe('/');
  });
});
