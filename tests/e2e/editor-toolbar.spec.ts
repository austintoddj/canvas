import { test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';
import {
    createNewPost,
    enterFocusMode,
    exitFocusMode,
    expectBodyToolbarPinnedWhileScrolling,
    fillLongPostBody,
    fillPostTitle,
    uniqueTitle,
} from './helpers/posts';

test.describe('Post body toolbar', () => {
    test('stays pinned while the body scrolls', async ({ page }) => {
        await loginAsAdmin(page);
        await createNewPost(page);
        await fillPostTitle(page, uniqueTitle('Sticky toolbar'));

        const editor = await fillLongPostBody(page);

        await expectBodyToolbarPinnedWhileScrolling(page, editor);
    });

    test('stays pinned inside focus mode', async ({ page }) => {
        await loginAsAdmin(page);
        await createNewPost(page);
        await fillPostTitle(page, uniqueTitle('Sticky toolbar focus'));

        const editor = await fillLongPostBody(page);

        await enterFocusMode(page);
        await expectBodyToolbarPinnedWhileScrolling(page, editor);
        await exitFocusMode(page);
    });
});
