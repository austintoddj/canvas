import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';
import {
    createNewPost,
    fillPostBody,
    fillPostTitle,
    openPostInspector,
    publishNow,
    uniqueTitle,
    waitForAutosaveQuiet,
} from './helpers/posts';

test.describe('canvas:ui public reader', () => {
    test('guest can read a published post on /canvas-ui', async ({ page }) => {
        const title = uniqueTitle('Reader');
        const body = 'Public reader body for e2e.';

        await loginAsAdmin(page);
        await createNewPost(page);
        await fillPostTitle(page, title);
        await fillPostBody(page, body);
        await waitForAutosaveQuiet(page);
        await publishNow(page);

        // Read the real slug from the inspector (may not equal slugify(title) if uniqueness rewrote it).
        await openPostInspector(page);
        const slug = (await page.locator('input[name="slug"]').inputValue()).trim();
        expect(slug.length).toBeGreaterThan(0);
        await page.keyboard.press('Escape');

        // Guest session: clear cookies so admin session does not affect the reader.
        await page.context().clearCookies();

        await page.goto(`/canvas-ui/${slug}`);
        await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 20_000 });
        await expect(page.locator('article')).toContainText(body);

        // Index should list the post as well.
        await page.goto('/canvas-ui');
        await expect(page.getByRole('link', { name: title }).or(page.getByText(title)).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});