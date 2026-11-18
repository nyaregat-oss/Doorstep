import { describe, expect, it } from 'vitest';
import { categories } from './catalog';
import { getSampleProviders } from './marketplace-data';

describe('sample marketplace directory', () => {
  it('contains three clearly labeled provider examples in each category', () => {
    const providers = getSampleProviders();
    expect(providers).toHaveLength(48);
    expect(new Set(providers.map((provider) => provider.id)).size).toBe(48);
    expect(categories.every(([category]) => providers.filter((provider) => provider.category === category).length === 3)).toBe(true);
    expect(providers.every((provider) => provider.isSample && provider.currency === 'KES' && provider.startingPrice > 0)).toBe(true);
  });

  it('keeps review scores and verification claims out of the demo data', () => {
    expect(getSampleProviders().every((provider) => !('rating' in provider) && !('verified' in provider))).toBe(true);
  });
});
