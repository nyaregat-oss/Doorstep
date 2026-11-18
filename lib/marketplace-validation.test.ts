import { describe, expect, it } from 'vitest';
import { isCurrencyCode, parseStartingPrice } from './marketplace-validation';

describe('marketplace listing values', () => {
  it('accepts non-negative prices with at most two decimal places', () => {
    expect(parseStartingPrice('0')).toBe(0);
    expect(parseStartingPrice('1250.5')).toBe(1250.5);
    expect(parseStartingPrice('1250.50')).toBe(1250.5);
    expect(parseStartingPrice('-1')).toBeNull();
    expect(parseStartingPrice('1.234')).toBeNull();
    expect(parseStartingPrice('1e3')).toBeNull();
    expect(parseStartingPrice('')).toBeNull();
    expect(parseStartingPrice('10000000000')).toBeNull();
  });

  it('accepts uppercase three-letter currency codes', () => {
    expect(isCurrencyCode('KES')).toBe(true);
    expect(isCurrencyCode('USD')).toBe(true);
    expect(isCurrencyCode('Kes')).toBe(false);
    expect(isCurrencyCode('KE')).toBe(false);
  });
});
