import { describe, expect, it } from 'vitest';
import { categories, sampleContentLabel } from './catalog';

describe('landing sample catalog', () => {
  it('includes the 16 prototype service categories', () => {
    expect(categories).toHaveLength(16);
    expect(categories[0][0]).toBe('Plumbing');
    expect(categories[15][0]).toBe('Automotive');
  });
  it('keeps sample content explicitly labeled', () => {
    expect(sampleContentLabel()).toContain('Sample');
  });
});
