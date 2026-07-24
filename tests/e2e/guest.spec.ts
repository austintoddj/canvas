import { expect, test } from '@playwright/test';

test.describe('Guest access', () => {
    test('guest cannot open the admin SPA', async ({ page }) => {
        await page.goto('/canvas');
        await expect(page).not.toHaveURL(/\/canvas\/?$/);
    });
});
