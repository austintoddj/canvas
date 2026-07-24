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
});
