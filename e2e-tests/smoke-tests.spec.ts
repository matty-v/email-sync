import { expect, test } from '@playwright/test';

test.describe('smoke test', async () => {
  test('app is running', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('React Boilerplate');
  });
});
