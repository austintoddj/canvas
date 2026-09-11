import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, type Locator, type Page } from '@playwright/test';

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
    const payload = response.request().postDataJSON() as {
        published_at?: string | null;
        schedule?: boolean;
        promote?: boolean;
    } | null;
    expect(payload?.published_at, 'schedule payload must include a future published_at').toBeTruthy();
    expect(payload?.published_at, 'schedule published_at must be ISO with timezone').toMatch(
        /(?:Z|[+-]\d{2}:?\d{2})$/i
    );
    expect(payload?.schedule, 'schedule intent flag required').toBe(true);
    expect(payload?.promote, 'schedule promote required').toBe(true);
    expect(response.ok(), `schedule store failed: ${response.status()}`).toBeTruthy();

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

const bodyToolbarSelector = '[data-post-body-toolbar="true"]';
const bodySurfaceSelector = '[data-post-body-surface="true"]';
const bodyEditorSelector = '.ProseMirror[contenteditable="true"]';

/** Fill the body with enough paragraphs that the editor is taller than the viewport. */
export async function fillLongPostBody(page: Page, paragraphs = 60): Promise<Locator> {
    const editor = page.locator(bodyEditorSelector).first();
    await expect(editor).toBeVisible({ timeout: 20_000 });
    await editor.click();

    // insertText skips per-key events, so this stays fast; Enter is a real key so
    // ProseMirror splits the paragraph.
    await page.keyboard.insertText('Sticky toolbar filler paragraph.');
    for (let index = 1; index < paragraphs; index += 1) {
        await page.keyboard.press('Enter');
        await page.keyboard.insertText(`Sticky toolbar filler paragraph ${index}.`);
    }

    return editor;
}

export async function enterFocusMode(page: Page): Promise<void> {
    await page.locator('[data-post-focus-toggle="true"]').click();
    await expect(page.locator('[data-post-editor-focus="true"]')).toBeVisible({ timeout: 10_000 });
}

export async function exitFocusMode(page: Page): Promise<void> {
    await page.getByRole('button', { name: 'Exit focus mode' }).click();
    await expect(page.locator('[data-post-editor-focus="false"]')).toBeVisible({ timeout: 10_000 });
}

async function boxOf(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
    const box = await locator.boundingBox();
    expect(box, 'element must be rendered').not.toBeNull();

    return box!;
}

/**
 * Scroll the editor's scroll container and assert the body toolbar pins in place
 * while the body scrolls beneath it. Container-agnostic: works whether the page
 * (normal mode) or the focus-mode pane owns the scroll.
 */
export async function expectBodyToolbarPinnedWhileScrolling(page: Page, editor: Locator): Promise<void> {
    const toolbar = page.locator(bodyToolbarSelector);
    const surface = page.locator(bodySurfaceSelector);
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    // Typing leaves the caret (and therefore the scroll position) at the bottom of
    // the body. Hovering the editor's top-left scrolls it back into view, which is
    // the baseline we measure from — reading the box before this would record a
    // position that is already scrolled past the toolbar.
    await editor.hover({ position: { x: 20, y: 20 } });
    const surfaceBefore = await boxOf(surface);

    // Wheel over the editor so the nearest scrollable ancestor receives it.
    await page.mouse.wheel(0, 2_000);

    // The surface (whose top edge sits above the toolbar) must scroll well out of view.
    await expect.poll(async () => (await boxOf(surface)).y, { timeout: 5_000 }).toBeLessThan(surfaceBefore.y - 500);

    const pinned = await boxOf(toolbar);
    const surfaceAfter = await boxOf(surface);

    // Surface top is above the toolbar => the toolbar stuck instead of scrolling away.
    expect(surfaceAfter.y, 'surface top should have scrolled past the toolbar').toBeLessThan(pinned.y);
    expect(pinned.y, 'toolbar must remain on screen').toBeGreaterThanOrEqual(0);
    expect(pinned.y + pinned.height, 'toolbar must remain on screen').toBeLessThanOrEqual(viewport!.height);

    // Keep scrolling: the body moves, the toolbar does not.
    await page.mouse.wheel(0, 400);
    await expect.poll(async () => (await boxOf(surface)).y, { timeout: 5_000 }).toBeLessThan(surfaceAfter.y - 100);

    const stillPinned = await boxOf(toolbar);
    expect(Math.abs(stillPinned.y - pinned.y), 'toolbar should not move while scrolling').toBeLessThanOrEqual(1);

    // A pinned toolbar is only useful if it is clickable — Playwright's actionability
    // check fails here if something (e.g. a header) is painted over it.
    const bold = toolbar.getByRole('button', { name: 'Bold' });
    await bold.click();
    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await bold.click();
    await expect(bold).toHaveAttribute('aria-pressed', 'false');
}
