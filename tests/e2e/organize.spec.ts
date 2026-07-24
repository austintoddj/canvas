import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';

test.describe('Organize taxonomy', () => {
    test('admin can create a topic and a tag', async ({ page }) => {
        const stamp = Date.now();
        const topicName = `E2E Topic ${stamp}`;
        const tagName = `E2E Tag ${stamp}`;

        await loginAsAdmin(page);
        await page.goto('/canvas/organize');

        await expect(page.getByRole('heading', { name: 'Organize' })).toBeVisible({ timeout: 20_000 });

        // Topics tab is default — empty state or header CTA.
        const newTopic = page.getByRole('button', { name: /New topic|Create a topic/i }).first();
        await expect(newTopic).toBeVisible({ timeout: 15_000 });
        await newTopic.click();

        const topicNameInput = page.locator('input[name="name"]');
        await expect(topicNameInput).toBeVisible({ timeout: 15_000 });
        await topicNameInput.fill(topicName);
        await page.getByRole('button', { name: 'Create topic' }).click();

        await expect(page.getByText(topicName).first()).toBeVisible({ timeout: 15_000 });

        // Switch to tags (pill nav radios).
        await page.getByRole('radio', { name: 'Tags' }).click();
        await page.waitForTimeout(500);

        const newTag = page.getByRole('button', { name: /New tag|Create a tag/i }).first();
        await expect(newTag).toBeVisible({ timeout: 15_000 });
        await newTag.click();

        const tagNameInput = page.locator('input[name="name"]');
        await expect(tagNameInput).toBeVisible({ timeout: 15_000 });
        await tagNameInput.fill(tagName);
        await page.getByRole('button', { name: 'Create tag' }).click();

        await expect(page.getByText(tagName).first()).toBeVisible({ timeout: 15_000 });
    });
});
