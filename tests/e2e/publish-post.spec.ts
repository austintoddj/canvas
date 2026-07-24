import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';
import {
    createNewPost,
    expectPostInList,
    fillPostTitle,
    publishNow,
    uniqueTitle,
    waitForAutosaveQuiet,
} from './helpers/posts';

test.describe('Quick publish smoke', () => {
    test('admin can create a draft and publish it', async ({ page }) => {
        const postTitle = uniqueTitle('Quick publish');

        await loginAsAdmin(page);
        await createNewPost(page);
        await fillPostTitle(page, postTitle);
        await waitForAutosaveQuiet(page);
        await publishNow(page);
        await expectPostInList(page, postTitle);
    });
});
