import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';
import {
    createNewPost,
    deletePostFromInspector,
    discardPendingChanges,
    expectPostInList,
    expectPostNotInList,
    fillPostBody,
    fillPostTitle,
    promotePendingUpdate,
    publishNow,
    scheduleForLater,
    setFeaturedImageFromUpload,
    uniqueTitle,
    waitForAutosaveQuiet,
} from './helpers/posts';

test.describe('Post lifecycle happy paths', () => {
    test('create → featured image → publish → discard pending → update → delete', async ({ page }) => {
        const title = uniqueTitle('Lifecycle');
        const edited = `${title} (edited)`;
        const finalTitle = `${title} (final)`;

        await loginAsAdmin(page);
        await createNewPost(page);

        await fillPostTitle(page, title);
        await fillPostBody(page, 'Hello from the Playwright lifecycle journey.');
        await waitForAutosaveQuiet(page);

        // Featured image on draft (library upload + select).
        await setFeaturedImageFromUpload(page);
        await waitForAutosaveQuiet(page);
        // Escape may already have been used; ensure inspector closed before publish chrome is clickable.
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        await publishNow(page);
        await expectPostInList(page, title);

        // Re-open the published editor from the list.
        await page.getByRole('link', { name: title }).first().click();
        await expect(page).toHaveURL(/\/canvas\/posts\/[0-9a-f-]{36}/i, { timeout: 15_000 });
        await expect(page.locator('#post-title')).toHaveValue(title);

        // Pending edit → discard restores live title.
        await fillPostTitle(page, edited);
        await waitForAutosaveQuiet(page);
        await expect(page.locator('[data-has-pending-changes="true"]')).toBeVisible({ timeout: 20_000 });

        await discardPendingChanges(page);
        await expect(page.locator('#post-title')).toHaveValue(title);
        await expect(page.locator('[data-publish-status="published"]')).toBeVisible();

        // Pending edit → update promotes to live.
        await fillPostTitle(page, finalTitle);
        await waitForAutosaveQuiet(page);
        await expect(page.locator('[data-has-pending-changes="true"]')).toBeVisible({ timeout: 20_000 });

        await promotePendingUpdate(page);
        await expect(page.locator('#post-title')).toHaveValue(finalTitle);

        await expectPostInList(page, finalTitle);

        // Delete from the editor.
        await page.getByRole('link', { name: finalTitle }).first().click();
        await expect(page).toHaveURL(/\/canvas\/posts\/[0-9a-f-]{36}/i);
        await deletePostFromInspector(page);
        await expectPostNotInList(page, finalTitle);
    });

    test('schedule a post for later and cancel the schedule', async ({ page }) => {
        const title = uniqueTitle('Scheduled');

        await loginAsAdmin(page);
        await createNewPost(page);
        await fillPostTitle(page, title);
        await waitForAutosaveQuiet(page);

        await scheduleForLater(page);
        await expect(page.locator('[data-publish-status="scheduled"]')).toBeVisible();

        // Cancel schedule via inspector unpublish/cancel control.
        await page.locator('[data-post-inspector-trigger]').click();
        await expect(page.locator('[data-post-inspector-section="post"]')).toBeVisible();
        await page.getByRole('button', { name: /Cancel schedule|Unpublish/i }).click();
        await expect(page.locator('[data-publish-status="draft"]')).toBeVisible({ timeout: 20_000 });
    });
});
