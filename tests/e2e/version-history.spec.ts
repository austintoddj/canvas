import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';
import {
    createNewPost,
    fillPostBody,
    fillPostTitle,
    publishNow,
    uniqueTitle,
    waitForAutosaveQuiet,
} from './helpers/posts';

test.describe('Version history', () => {
    test('publish creates a checkpoint with a reason label', async ({ page }) => {
        test.setTimeout(90_000);

        const title = uniqueTitle('History');

        await loginAsAdmin(page);
        await createNewPost(page);
        await fillPostTitle(page, title);
        await fillPostBody(page, 'Body for version history e2e.');
        await waitForAutosaveQuiet(page);
        await publishNow(page);

        // Stay on editor after publish (status chip visible).
        await expect(page.locator('[data-publish-status="published"]')).toBeVisible({ timeout: 20_000 });

        const history = page.locator('[data-post-history-trigger="true"]');
        await expect(history).toBeVisible({ timeout: 15_000 });
        await history.click();

        await expect(page.locator('[data-version-history-drawer="true"]')).toBeVisible({ timeout: 15_000 });
        await expect(page.locator('[data-version-history-list="true"]')).toBeVisible({ timeout: 15_000 });

        const publishedRow = page.locator('[data-revision-reason="published"]').first();
        await expect(publishedRow).toBeVisible({ timeout: 15_000 });
        await expect(publishedRow).toContainText(/Published/i);
    });
});
