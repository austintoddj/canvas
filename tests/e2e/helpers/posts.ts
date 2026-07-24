import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, type Page } from '@playwright/test';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

export function uniqueTitle(prefix = 'E2E post'): string {
    return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function sampleImagePath(): string {
    return path.join(fixturesDir, 'sample.png');
}

/** Open /posts/new, wait for UUID route, return post id. */
export async function createNewPost(page: Page): Promise<string> {
    await page.goto('/canvas/posts/new');
    await expect(page).toHaveURL(/\/canvas\/posts\/([0-9a-f-]{36})/i, { timeout: 20_000 });
    const match = page.url().match(/\/canvas\/posts\/([0-9a-f-]{36})/i);
    expect(match?.[1]).toBeTruthy();

    return match![1]!;
}

export async function fillPostTitle(page: Page, title: string): Promise<void> {
    const input = page.locator('#post-title');
    await expect(input).toBeVisible({ timeout: 20_000 });
    await input.fill(title);
}

/** TipTap contenteditable body. */
export async function fillPostBody(page: Page, text: string): Promise<void> {
    const editor = page.locator('.ProseMirror[contenteditable="true"]').first();
    await expect(editor).toBeVisible({ timeout: 20_000 });
    await editor.click();
    await page.keyboard.type(text, { delay: 5 });
}

/** Wait until autosave finishes (or give a short settle if the indicator never appears). */
export async function waitForAutosaveQuiet(page: Page): Promise<void> {
    const saving = page.locator('[data-post-save-status="saving"]');
    const pending = page.locator('[data-post-save-status="pending"]');

    // If dirty/saving indicators show, wait for them to clear.
    try {
        await expect(saving.or(pending)).toBeVisible({ timeout: 2_000 });
        await expect(saving).toHaveCount(0, { timeout: 20_000 });
        await expect(pending).toHaveCount(0, { timeout: 20_000 });
    } catch {
        // First keystrokes may already have saved; settle briefly.
        await page.waitForTimeout(600);
    }

    await page.waitForTimeout(400);
}

export async function publishNow(page: Page): Promise<void> {
    await waitForAutosaveQuiet(page);

    const trigger = page.locator('[data-post-publish-trigger]');
    await expect(trigger).toBeVisible({ timeout: 20_000 });
    await expect(trigger).toBeEnabled();
    await trigger.click();

    const submit = page.locator('[data-publish-dialog-submit]');
    await expect(submit).toBeVisible({ timeout: 20_000 });
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(submit).toBeHidden({ timeout: 20_000 });
    await expect(page.locator('[data-publish-status="published"]')).toBeVisible({ timeout: 20_000 });
}

export async function scheduleForLater(page: Page): Promise<void> {
    await waitForAutosaveQuiet(page);

    await page.locator('[data-post-publish-trigger]').click();

    const later = page.getByRole('radio', { name: 'Schedule for later' });
    await later.click();
    await expect(later).toBeChecked({ timeout: 5_000 });
    await expect(page.locator('[data-publish-schedule="true"]')).toBeAttached({ timeout: 5_000 });

    // Far-future preset so timezone quirks cannot flip status to "published".
    const nextMonday = page.getByRole('button', { name: /Next Monday/i });
    await expect(nextMonday).toBeVisible({ timeout: 5_000 });
    await nextMonday.click();

    const submit = page.locator('[data-publish-dialog-submit]');
    await expect(submit).toBeVisible({ timeout: 20_000 });
    await expect(submit).toHaveText(/Schedule/i, { timeout: 5_000 });
    await expect(submit).toBeEnabled();

    const responsePromise = page.waitForResponse(
        (response) =>
            response.request().method() === 'POST' &&
            /\/canvas\/api\/posts\//.test(response.url()) &&
            response.status() < 500,
        { timeout: 20_000 }
    );

    await submit.click();

    const response = await responsePromise;
    const payload = response.request().postDataJSON() as { published_at?: string | null } | null;
    expect(payload?.published_at, 'schedule payload must include a future published_at').toBeTruthy();

    await expect(submit).toBeHidden({ timeout: 20_000 });
    await expect(page.locator('[data-publish-status="scheduled"]')).toBeVisible({ timeout: 20_000 });
}

export async function openPostInspector(page: Page): Promise<void> {
    await page.locator('[data-post-inspector-trigger]').click();
    await expect(page.locator('[data-post-inspector-section="post"]')).toBeVisible({ timeout: 15_000 });
}

export async function closePostInspector(page: Page): Promise<void> {
    // Side drawer close button is typically the dialog close / Escape.
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-post-inspector-section="post"]')).toBeHidden({ timeout: 10_000 });
}

/**
 * Open featured image picker, upload a file, select the new library tile.
 * Leaves the inspector open.
 */
export async function setFeaturedImageFromUpload(page: Page, filePath = sampleImagePath()): Promise<void> {
    await openPostInspector(page);

    await page.getByRole('button', { name: /Choose image|Change image/i }).click();

    // Prefer the stable hook; fall back to any file input in the open picker dialog.
    const fileInput = page.locator('[data-media-file-input="true"], input[type="file"]').last();
    await expect(fileInput).toBeAttached({ timeout: 10_000 });
    await fileInput.setInputFiles(filePath);

    // MediaPickerPanel uploads and auto-selects the new file (closes the dialog).
    // If that path is unavailable, fall back to clicking a library tile.
    const preview = page.locator('[data-post-inspector-section="post"] img').first();
    try {
        await expect(preview).toBeVisible({ timeout: 15_000 });
    } catch {
        const tile = page.locator('[data-media-tile="true"]').first();
        await expect(tile).toBeVisible({ timeout: 10_000 });
        await tile.click();
        await expect(preview).toBeVisible({ timeout: 15_000 });
    }
}

export async function promotePendingUpdate(page: Page): Promise<void> {
    const update = page.locator('[data-post-update-trigger]');
    await expect(update).toBeVisible({ timeout: 20_000 });
    await update.click();

    // Confirm alert — primary Update in the dialog (second "Update" if both exist).
    const confirm = page.getByRole('button', { name: /^Update$/ }).last();
    await expect(confirm).toBeVisible({ timeout: 10_000 });
    await confirm.click();

    await expect(page.locator('[data-has-pending-changes="true"]')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('[data-publish-status="published"]')).toBeVisible({ timeout: 10_000 });
}

export async function discardPendingChanges(page: Page): Promise<void> {
    await openPostInspector(page);

    const discard = page.locator('[data-publish-discard]');
    await expect(discard).toBeVisible({ timeout: 15_000 });
    await discard.click();

    await expect(page.locator('[data-has-pending-changes="true"]')).toHaveCount(0, { timeout: 20_000 });
    await closePostInspector(page);
}

export async function deletePostFromInspector(page: Page): Promise<void> {
    await openPostInspector(page);

    await page.getByRole('button', { name: 'Delete post' }).click();
    await page.getByRole('button', { name: /^Delete$/ }).click();

    await expect(page).toHaveURL(/\/canvas\/posts\/?$/, { timeout: 20_000 });
}

export async function expectPostInList(page: Page, title: string): Promise<void> {
    await page.goto('/canvas/posts');
    await expect(page.getByRole('link', { name: title }).first()).toBeVisible({ timeout: 20_000 });
}

export async function expectPostNotInList(page: Page, title: string): Promise<void> {
    await page.goto('/canvas/posts');
    // Empty state or list without this title.
    await expect(page.getByRole('link', { name: title })).toHaveCount(0, { timeout: 15_000 });
}

export async function unpublishFromInspector(page: Page): Promise<void> {
    await openPostInspector(page);
    await page.getByRole('button', { name: /^Unpublish$/i }).click();
    await expect(page.locator('[data-publish-status="draft"]')).toBeVisible({ timeout: 20_000 });
    await closePostInspector(page);
}

export async function openPreview(page: Page): Promise<void> {
    await page.locator('[data-post-preview-trigger]').click();
    // Dialog root may report as hidden during transitions; assert content instead.
    await expect(
        page.locator('[data-post-preview-dialog="true"] h1, [data-post-preview-body="true"]').first()
    ).toBeVisible({
        timeout: 15_000,
    });
}

export async function closePreview(page: Page): Promise<void> {
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-post-preview-body="true"], [data-post-preview-empty="true"]')).toHaveCount(0, {
        timeout: 10_000,
    });
}
