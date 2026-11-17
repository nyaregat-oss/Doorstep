import { expect, test } from '@playwright/test';

for (const width of [320, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`landing page has no horizontal overflow or console errors at ${width}px in ${theme} mode`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
        localStorage.setItem('theme', value);
      }, theme);
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Find the Right Professional. Get Things Done.' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
      expect(errors).toEqual([]);
    });
  }
}
