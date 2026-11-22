import { expect, test } from '@playwright/test';

test.describe('Doorstep marketplace discovery & profile flows', () => {
  test('homepage search and category tiles navigate to filtered browse results', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    await page.goto('/');
    await page.getByLabel('What service do you need?').fill('Plumbing');
    await page.getByLabel('Your location').fill('Westlands');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page).toHaveURL(/\/browse\?q=Plumbing&location=Westlands/);
    await expect(page.getByRole('heading', { name: 'Browse services & professionals' })).toBeVisible();

    await page.goto('/');
    await page.locator('#explore').getByRole('link', { name: /Electrical/i }).first().click();
    await expect(page).toHaveURL(/\/browse\?category=Electrical/);
    expect(errors).toEqual([]);
  });

  test('provider profile supports service selection, portfolio lightbox, and booking preview', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    await page.goto('/browse');
    await page.getByRole('link', { name: /View Profile/i }).first().click();
    await expect(page).toHaveURL(/\/providers\/sample-/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Open and close portfolio lightbox
    await page.getByRole('button', { name: /View portfolio image 1/i }).click();
    await expect(page.getByRole('dialog', { name: 'Portfolio image viewer' })).toBeVisible();
    await page.getByRole('button', { name: 'Close image viewer' }).click();
    await expect(page.getByRole('dialog', { name: 'Portfolio image viewer' })).toBeHidden();

    // Submit preview booking request
    await page.getByRole('tab', { name: 'Request a Quote' }).click();
    await page.locator('#request-form input[type="date"]').fill('2027-06-15');
    await page.locator('#request-form input[list]').fill('Kilimani, Nairobi');
    await page.locator('#request-form textarea').fill('Need inspection and repair for kitchen mixer tap.');
    await page.getByRole('button', { name: 'Preview quote request' }).click();
    await expect(page.getByText(/Preview only:/)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('mobile navigation, mobile filter drawer, and secondary routes render cleanly', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/browse');
    await page.getByRole('button', { name: /Filter & Sort/i }).click();
    await expect(page.getByRole('dialog', { name: 'Filter services' })).toBeVisible();
    await page.getByRole('button', { name: 'Close filters' }).click();

    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(page.getByRole('dialog', { name: 'Mobile menu' })).toBeVisible();
    await page.getByRole('button', { name: 'Close navigation menu' }).click();

    for (const route of ['/terms', '/privacy', '/report', '/dashboard', '/login', '/register']) {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(400);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    }
    expect(errors).toEqual([]);
  });
});
