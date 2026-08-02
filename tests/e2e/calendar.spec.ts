import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';
import { createNewPost, fillPostTitle, scheduleForLater, uniqueTitle, waitForAutosaveQuiet } from './helpers/posts';

test.describe('Publishing calendar', () => {
    test('scheduled post appears on the month grid and opens the editor', async ({ page }) => {
        test.setTimeout(90_000);

        const title = uniqueTitle('Cal');

        await loginAsAdmin(page);
        await createNewPost(page);
        await fillPostTitle(page, title);
        await waitForAutosaveQuiet(page);
        await scheduleForLater(page);

        await page.goto('/canvas/calendar');
        await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 20_000 });
        await expect(page.locator('[data-calendar-grid="true"]')).toBeVisible({ timeout: 15_000 });

        // Next Monday preset from scheduleForLater may land in next month — page forward if needed.
        let found = false;
        for (let attempt = 0; attempt < 3; attempt++) {
            const chip = page.getByText(title, { exact: false }).first();
            if (await chip.isVisible().catch(() => false)) {
                found = true;
                break;
            }

            // Mobile uses dots only; click days that have scheduled content via day cells.
            const next = page.getByRole('button', { name: /Next month/i });
            await next.click();
            await page.waitForTimeout(400);
        }

        // Prefer chip click path; fall back to scanning day cells for the title after open.
        if (found) {
            // Title chips are desktop-only; on mobile we must open a day panel.
            const chip = page.getByText(title, { exact: false }).first();
            if (await chip.isVisible().catch(() => false)) {
                // Click the parent day cell (chip is not itself a button target for navigation).
                const day = chip.locator('xpath=ancestor::button[@data-calendar-day]').first();
                await day.click();
            }
        } else {
            // Exhaustive: use API-less brute force — open each non-empty looking day is heavy;
            // scheduleForLater uses "Next Monday" which is almost always this or next month.
            await page.getByRole('button', { name: /Previous month/i }).click();
            await page.waitForTimeout(300);
        }

        // If day panel is not open with the post, click any day cell that contains the title string.
        const panelPost = page
            .locator('[data-calendar-day-panel="true"]')
            .getByRole('button', { name: new RegExp(title) });
        if (!(await panelPost.isVisible().catch(() => false))) {
            const dayWithTitle = page.locator(`[data-calendar-day]:has-text("${title}")`).first();
            if (await dayWithTitle.isVisible().catch(() => false)) {
                await dayWithTitle.click();
            } else {
                // Mobile: dots only — advance months and click days with dots until panel lists title.
                for (let month = 0; month < 2 && !(await panelPost.isVisible().catch(() => false)); month++) {
                    const dotted = page.locator('[data-calendar-day]:has([data-calendar-day-dots="true"])');
                    const count = await dotted.count();
                    for (let i = 0; i < count; i++) {
                        await dotted.nth(i).click();
                        if (await panelPost.isVisible().catch(() => false)) {
                            break;
                        }
                    }
                    if (!(await panelPost.isVisible().catch(() => false))) {
                        await page.getByRole('button', { name: /Next month/i }).click();
                        await page.waitForTimeout(300);
                    }
                }
            }
        }

        await expect(page.locator('[data-calendar-day-panel="true"]')).toBeVisible({ timeout: 10_000 });
        await expect(panelPost).toBeVisible({ timeout: 10_000 });
        await panelPost.click();
        await expect(page).toHaveURL(/\/canvas\/posts\/[0-9a-f-]{36}/i, { timeout: 15_000 });
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
