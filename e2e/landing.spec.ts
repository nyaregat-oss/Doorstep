import { expect, test } from '@playwright/test';

for (const width of [320, 390, 820, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`landing page has no horizontal overflow, broken images, or console errors at ${width}px in ${theme} mode`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.route('https://fonts.googleapis.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
      );
      await page.route('https://fonts.gstatic.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'font/woff2', body: Buffer.alloc(0) }),
      );
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
        localStorage.setItem('theme', value);
      }, theme);
      await page.reload();
      await expect(
        page.getByRole('heading', { name: 'Your next great service is just a doorstep away.' }),
      ).toBeVisible();
      await expect(page.getByRole('status').filter({ hasText: 'Pre-launch:' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

      // Ensure above-the-fold and rendered images load without errors.
      const brokenCount = await page.evaluate(async () => {
        const imgs = Array.from(document.querySelectorAll('img'));
        imgs.forEach((img) => img.scrollIntoView());
        await new Promise((r) => setTimeout(r, 400));
        return imgs.filter((img) => img.complete && img.naturalWidth === 0).length;
      });
      expect(brokenCount).toBe(0);
      expect(errors).toEqual([]);
    });
  }
}
