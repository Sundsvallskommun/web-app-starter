import { expect, test } from '@playwright/test';

// Smoke test: proves Playwright drives the real Next (Pages Router) admin server end-to-end.
// We target the public /login page, which renders without a backend session.
test.describe('admin app shell', () => {
  test('serves the login page', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
