import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';
import {
    closePreview,
    createNewPost,
    fillPostBody,
    fillPostTitle,
    openPreview,
    publishNow,
    uniqueTitle,
    unpublishFromInspector,
    waitForAutosaveQuiet,
} from './helpers/posts';

test.describe('Preview and unpublish', () => {
    test('preview shows title and body; unpublish returns to draft', async ({ page }) => {
        const title = uniqueTitle('Preview');
        const body = 'Preview body from Playwright.';

        await loginAsAdmin(page);
        await createNewPost(page);
        await fillPostTitle(page, title);
        await fillPostBody(page, body);
        await waitForAutosaveQuiet(page);

        await openPreview(page);
        await expect(page.getByRole('heading', { name: title })).toBeVisible();
        await expect(page.locator('[data-post-preview-body="true"]')).toContainText(body);
        await closePreview(page);

        await publishNow(page);
        await expect(page.locator('[data-publish-status="published"]')).toBeVisible();

        await unpublishFromInspector(page);
        await expect(page.locator('[data-publish-status="draft"]')).toBeVisible();
        // Publish CTA returns for drafts.
        await expect(page.locator('[data-post-publish-trigger]')).toBeVisible();
    });
});
