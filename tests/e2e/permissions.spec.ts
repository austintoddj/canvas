import { expect, test } from '@playwright/test';

import { loginAsAdmin, loginAsContributor } from './helpers/auth';

test.describe('Role permissions in the SPA', () => {
    test('admin sees Users and Integrations nav', async ({ page }) => {
        await loginAsAdmin(page);

        await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Integrations' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Organize' })).toBeVisible();

        await page.goto('/canvas/users');
        await expect(page).toHaveURL(/\/canvas\/users/);
        await expect(page.getByRole('heading', { name: /Users/i })).toBeVisible({ timeout: 15_000 });

        await page.goto('/canvas/integrations');
        await expect(page).toHaveURL(/\/canvas\/integrations/);
        await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible({ timeout: 15_000 });
    });

    test('contributor cannot reach admin-only areas', async ({ page }) => {
        await loginAsContributor(page);

        await expect(page.getByRole('link', { name: 'Posts' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
        await expect(page.getByRole('link', { name: 'Integrations' })).toHaveCount(0);
        await expect(page.getByRole('link', { name: 'Organize' })).toHaveCount(0);

        // Direct URL should not load the admin UI successfully.
        await page.goto('/canvas/users');
        await expect(page.getByRole('heading', { name: /^Users$/i })).toHaveCount(0, { timeout: 10_000 });

        await page.goto('/canvas/integrations');
        await expect(page.getByRole('heading', { name: 'Integrations' })).toHaveCount(0, { timeout: 10_000 });

        // Contributor can still use posts.
        await page.goto('/canvas/posts');
        await expect(page.getByRole('heading', { name: 'Posts', exact: true })).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole('link', { name: 'New post' }).first()).toBeVisible();
    });
});
