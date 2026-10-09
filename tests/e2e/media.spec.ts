import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';
import { sampleImagePath } from './helpers/posts';

test.describe('Media library', () => {
    test('admin can upload an image from the media page', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/canvas/media');

        await expect(page.getByRole('heading', { name: 'Media', exact: true })).toBeVisible({ timeout: 20_000 });

        // Empty library uses empty-state upload; populated library uses the header button.
        // Both drive the same hidden file input.
        const fileInput = page.locator('[data-media-file-input="true"], input[type="file"]').first();
        await expect(fileInput).toBeAttached({ timeout: 15_000 });
        await fileInput.setInputFiles(sampleImagePath());

        await expect(page.locator('[data-media-grid="true"] img, [data-media-tile="true"] img').first()).toBeVisible({
            timeout: 20_000,
        });
    });

    test('admin can create a media tag, assign it, and filter', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/canvas/media');

        await expect(page.getByRole('heading', { name: 'Media', exact: true })).toBeVisible({ timeout: 20_000 });

        const fileInput = page.locator('[data-media-file-input="true"], input[type="file"]').first();
        await expect(fileInput).toBeAttached({ timeout: 15_000 });
        await fileInput.setInputFiles(sampleImagePath());
        await expect(page.locator('[data-media-grid="true"] img, [data-media-tile="true"] img').first()).toBeVisible({
            timeout: 20_000,
        });

        const tagName = `Hero-${Date.now()}`;
        const rail = page.getByRole('navigation', { name: 'Tags' });

        await rail.getByRole('button', { name: 'Filter by tag' }).click();
        await page.getByRole('menuitem', { name: 'New tag' }).click();
        await page.getByLabel('Tag name').fill(tagName);
        await page.getByRole('button', { name: 'New tag' }).last().click();

        await expect(rail.getByRole('button', { name: tagName, exact: true })).toBeVisible({ timeout: 10_000 });
        await expect(page.getByLabel('Tag name')).toHaveCount(0);
        await rail.getByRole('button', { name: 'All images' }).click();

        const tile = page.locator('[data-media-tile="true"]').first();
        await expect(tile).toBeVisible();
        await tile.click();
        await expect(page.getByText('Tags', { exact: true })).toBeVisible();
        await page.getByRole('combobox', { name: 'Add tag' }).fill(tagName);
        await page.getByRole('option', { name: tagName }).click();

        await page.getByRole('button', { name: 'Close media details' }).click();
        await rail.getByRole('button', { name: /Untagged/ }).click();
        await expect(page).toHaveURL(/untagged=1/);

        const tagPill = rail.getByRole('button', { name: tagName, exact: true });

        if ((await tagPill.count()) > 0) {
            await tagPill.click();
        } else {
            await rail.getByRole('button', { name: 'Filter by tag' }).click();
            await page.getByRole('menuitem', { name: tagName }).click();
        }
        await expect(page).toHaveURL(/tag=/);
        await expect(page.locator('[data-media-grid="true"] img, [data-media-tile="true"] img').first()).toBeVisible({
            timeout: 10_000,
        });
    });
});
