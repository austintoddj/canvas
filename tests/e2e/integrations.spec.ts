import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';

test.describe('Integrations webhooks', () => {
    test('admin can enable webhooks from a drawer on the integrations page', async ({ page }) => {
        test.setTimeout(90_000);

        await loginAsAdmin(page);
        await page.goto('/canvas/integrations');

        await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible({ timeout: 20_000 });

        const webhooksCard = page.locator('[data-integration-card="webhooks"]');
        await expect(webhooksCard).toBeVisible({ timeout: 15_000 });
        await webhooksCard.click();

        await expect(page).toHaveURL(/\/canvas\/integrations$/);
        await expect(page.locator('[data-side-drawer]')).toHaveCount(1);

        const urlInput = page.locator('[data-webhook-url="true"], input[name="webhook_url"]');
        await expect(urlInput).toBeVisible({ timeout: 15_000 });

        const endpoint = `https://example.com/hooks/canvas-e2e-${Date.now()}`;
        await urlInput.click();
        await urlInput.fill('');
        await urlInput.pressSequentially(endpoint, { delay: 5 });
        await expect(urlInput).toHaveValue(endpoint);

        const drawer = page.locator('[data-side-drawer]');
        const save = drawer.getByRole('button', { name: /^Save$/i });
        const adding = (await save.count()) === 0;
        const putPromise = page.waitForResponse(
            (response) => response.request().method() === 'PUT' && response.url().includes('/canvas/api/integrations'),
            { timeout: 20_000 }
        );

        if (adding) {
            const sendTest = drawer.getByRole('button', { name: /^Send test$/i });
            await expect(sendTest).toBeEnabled({ timeout: 10_000 });
            await sendTest.click();
        } else {
            await expect(save).toBeEnabled({ timeout: 10_000 });
            await save.click();
        }

        const putResponse = await putPromise;
        expect(
            [200, 201, 422, 502].includes(putResponse.status()),
            `unexpected webhook save status ${putResponse.status()}`
        ).toBeTruthy();

        if (putResponse.ok()) {
            await expect(
                page
                    .locator('[data-webhook-plain-secret="true"]')
                    .or(page.getByText(/Webhook settings saved/i))
                    .first()
            ).toBeVisible({
                timeout: 20_000,
            });

            const secretDone = page.locator('[data-webhook-secret-done="true"]');
            if (await secretDone.isVisible().catch(() => false)) {
                await secretDone.click();
            }
        } else {
            await expect(page.getByText(/could not be delivered|Unable to save|please fix|HTTP /i).first()).toBeVisible(
                { timeout: 10_000 }
            );
        }

        await expect(page).toHaveURL(/\/canvas\/integrations$/);

        if ((await drawer.getByRole('link', { name: /View more/i }).count()) === 0) {
            await webhooksCard.click();
        }

        await expect(drawer.getByRole('link', { name: /View more/i })).toBeVisible();
        await drawer.getByRole('link', { name: /View more/i }).click();

        await expect(page).toHaveURL(/\/canvas\/integrations\/webhooks$/);
        await expect(page.getByRole('heading', { level: 1, name: 'Webhook logs' })).toBeVisible({ timeout: 15_000 });
        await expect(page.locator('#webhook-logs')).toBeVisible();
        await expect(page.locator('[data-webhook-deliveries="true"]')).toBeVisible();
        await expect(page.locator('[data-webhooks-hub="true"]')).toHaveCount(0);
        await expect(page.locator('[data-integration-back]')).toBeVisible();
    });
});
