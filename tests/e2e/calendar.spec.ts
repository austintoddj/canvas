import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';
import {
    createNewPost,
    fillPostTitle,
    localDateKeyFromIso,
    scheduleForLater,
    uniqueTitle,
    waitForAutosaveQuiet,
} from './helpers/posts';

test.describe('Publishing calendar', () => {
    test('scheduled post appears on the month grid and opens the editor', async ({ page }) => {
        test.setTimeout(90_000);

        const title = uniqueTitle('Cal');

        await loginAsAdmin(page);
        await createNewPost(page);
        await fillPostTitle(page, title);
        await waitForAutosaveQuiet(page);
        const { publishedAt, postId } = await scheduleForLater(page);

        // Deep-link to the local day bucket for the schedule instant — no month scanning.
        const dayKey = localDateKeyFromIso(publishedAt);
        const monthKey = dayKey.slice(0, 7);

        const calendarResponse = page.waitForResponse(
            (response) =>
                response.request().method() === 'GET' &&
                response.url().includes('/canvas/api/calendar/posts') &&
                response.ok(),
            { timeout: 20_000 }
        );

        await page.goto(`/canvas/calendar?month=${monthKey}&day=${dayKey}`);
        await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 20_000 });
        await expect(page.locator('[data-calendar-grid="true"]')).toBeVisible({ timeout: 15_000 });

        const body = (await (await calendarResponse).json()) as {
            posts?: Array<{ id?: string; title?: string | null; published_at?: string }>;
        };
        const match = (body.posts ?? []).find((post) => post.id === postId || post.title === title);
        expect(match, `calendar API must include scheduled post ${postId} (${title})`).toBeTruthy();

        await expect(page.locator('[data-calendar-day-panel="true"]')).toBeVisible({ timeout: 15_000 });
        const panelPost = page.locator(`[data-calendar-day-panel="true"] [data-calendar-post="${postId}"]`);
        await expect(panelPost).toBeVisible({ timeout: 15_000 });
        await expect(panelPost).toContainText(title);
        await panelPost.click();

        await expect(page).toHaveURL(new RegExp(`/canvas/posts/${postId}`, 'i'), { timeout: 15_000 });
        await expect(page.locator('#post-title')).toHaveValue(title);
    });

    test('keyboard arrows change the visible month', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/canvas/calendar');
        await expect(page.locator('[data-calendar-grid="true"]')).toBeVisible({ timeout: 20_000 });

        const title = page.locator('h2').filter({ hasText: /\d{4}/ }).first();
        await expect(title).toBeVisible();
        const before = (await title.textContent()) ?? '';

        await page.locator('[data-calendar-grid="true"]').focus();
        await page.keyboard.press('ArrowRight');

        await expect.poll(async () => (await title.textContent()) ?? '', { timeout: 5_000 }).not.toBe(before);

        await page.keyboard.press('ArrowLeft');
        await expect.poll(async () => (await title.textContent()) ?? '', { timeout: 5_000 }).toBe(before);
    });
});
