import { describe, expect, it } from 'vitest';
import { formatCurrency, getCategoryBrowseUrl, getCategoryImage, HOMEPAGE_CATEGORIES, KENYAN_LOCATIONS } from './kenya';

describe('Kenyan market utilities', () => {
  it('formats KES amounts cleanly without unnecessary decimals', () => {
    expect(formatCurrency(3500)).toBe('KES 3,500');
    expect(formatCurrency('12500.50', 'kes')).toBe('KES 12,500.50');
    expect(formatCurrency(0, 'USD')).toBe('USD 0');
  });

  it('provides all 12 homepage categories with valid image paths and browse links', () => {
    expect(HOMEPAGE_CATEGORIES).toHaveLength(12);
    expect(HOMEPAGE_CATEGORIES.every((cat) => cat.image.startsWith('/images/cat-'))).toBe(true);
    expect(getCategoryBrowseUrl(HOMEPAGE_CATEGORIES[0])).toBe('/browse?category=Plumbing');
    expect(getCategoryBrowseUrl(HOMEPAGE_CATEGORIES[11])).toBe('/browse');
  });

  it('maps catalog category names to authentic image paths and Kenyan locations', () => {
    expect(getCategoryImage('Plumbing')).toBe('/images/cat-plumbing.jpg');
    expect(getCategoryImage('IT support')).toBe('/images/cat-technology.jpg');
    expect(getCategoryImage('Unknown')).toBe('/images/cat-other.jpg');
    expect(KENYAN_LOCATIONS.some((loc) => loc.includes('Westlands'))).toBe(true);
  });
});
