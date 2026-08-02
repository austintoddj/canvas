import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';

test.describe('Integrations webhooks', () => {
    test('admin can enable webhooks and send a test delivery', async ({ page }) => {
        test.setTimeout(90_000);

        await loginAsAdmin(page);
        await page.goto('/canvas/integrations');

        await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible({ timeout: 20_000 });

        const webhooksCard = page.locator('[data-integration-card="webhooks"], [data-integration-row="webhooks"]');
        await expect(webhooksCard).toBeVisible({ timeout: 15_000 });
        await webhooksCard.getByRole('link', { name: /Configure|Manage/i }).click();

        await expect(page).toHaveURL(/\/canvas\/integrations\/webhooks$/);
        await expect(page.locator('[data-integration-page="true"]')).toBeVisible({ timeout: 15_000 });
        await expect(page.locator('[data-integration-hero="webhooks"]')).toBeVisible({ timeout: 15_000 });
        await expect(page.locator('[data-integration-section="settings"]')).toBeVisible({ timeout: 15_000 });
        await expect(page.locator('[data-integration-back]')).toBeVisible();

        const urlInput = page.locator('[data-webhook-url="true"], input[name="webhook_url"]');
        await expect(urlInput).toBeVisible();

        // Unique URL each run so Save stays enabled even if a prior run configured webhooks.
        const endpoint = `https://example.com/hooks/canvas-e2e-${Date.now()}`;
        await urlInput.click();
        await urlInput.fill('');
        await urlInput.pressSequentially(endpoint, { delay: 5 });
        await expect(urlInput).toHaveValue(endpoint);

        const save = page.getByRole('button', { name: /Enable webhooks|Save settings/i });
        await expect(save).toBeEnabled({ timeout: 10_000 });

        const saveResponse = page.waitForResponse(
            (response) =>
                response.request().method() === 'PUT' &&
                response.url().includes('/canvas/api/integrations') &&
                response.ok(),
            { timeout: 20_000 }
        );
        await save.click();
        await saveResponse;

        // First enable opens the one-time signing secret dialog; later saves toast only
        // (and navigates back to the list when there is no plain secret to reveal).
        await expect(
            page
                .locator('[data-webhook-plain-secret="true"]')
                .or(page.getByText(/Copy your signing secret|Webhook settings saved|Webhooks connected/i))
                .first()
        ).toBeVisible({ timeout: 20_000 });

        // Dismiss the secret dialog if it opened so footer actions stay usable.
        const secretDone = page.locator('[data-webhook-secret-done="true"]');
        if (await secretDone.isVisible().catch(() => false)) {
            await secretDone.click();
        }

        // If save-without-plain-secret navigated home, go back to the detail page.
        if (
            !(await page
                .locator('[data-integration-hero="webhooks"]')
                .isVisible()
                .catch(() => false))
        ) {
            await page.goto('/canvas/integrations/webhooks');
            await expect(page.locator('[data-integration-hero="webhooks"]')).toBeVisible({ timeout: 15_000 });
        }

        await expect(page.locator('[data-integration-hero="webhooks"]')).toContainText(/Enabled/i, {
            timeout: 15_000,
        });

        const sendTest = page.getByRole('button', { name: /^Send test$/i });
        await expect(sendTest).toBeVisible({ timeout: 15_000 });
        await sendTest.click({ force: true });

        // Delivery to example.com usually succeeds; failure still proves the path ran.
        await expect(
            page.getByText(/Test webhook sent|could not be delivered|Unable to send a test webhook/i).first()
        ).toBeVisible({ timeout: 30_000 });
    });
});
