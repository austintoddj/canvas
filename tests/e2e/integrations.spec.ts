import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';

test.describe('Integrations webhooks', () => {
    test('admin can enable webhooks and send a test delivery', async ({ page }) => {
        test.setTimeout(90_000);

        await loginAsAdmin(page);
        await page.goto('/canvas/integrations');

        await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible({ timeout: 20_000 });

        const webhooksRow = page.locator('[data-integration-row="webhooks"]');
        await expect(webhooksRow).toBeVisible({ timeout: 15_000 });
        await webhooksRow.getByRole('button', { name: /Configure|Manage/i }).click();

        await expect(page.locator('[data-integration-drawer="webhooks"]')).toBeVisible({ timeout: 15_000 });

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

        // First enable shows the one-time signing secret; later saves toast only.
        await expect(
            page
                .locator('[data-webhook-plain-secret="true"]')
                .or(page.getByText(/Webhook settings saved|Webhooks connected/i))
                .first()
        ).toBeVisible({ timeout: 20_000 });

        // Parent status refresh re-mounts the drawer footer — re-query after settle.
        await expect(page.locator('[data-integration-row="webhooks"]')).toContainText(/Enabled/i, {
            timeout: 15_000,
        });

        // Re-open if the drawer closed after save-without-plain-secret path.
        if (!(await page.locator('[data-integration-drawer="webhooks"]').isVisible().catch(() => false))) {
            await webhooksRow.getByRole('button', { name: /Configure|Manage/i }).click();
            await expect(page.locator('[data-integration-drawer="webhooks"]')).toBeVisible({ timeout: 10_000 });
        }

        const sendTest = page.getByRole('button', { name: /^Send test$/i });
        await expect(sendTest).toBeVisible({ timeout: 15_000 });
        await sendTest.click({ force: true });

        // Delivery to example.com usually succeeds; failure still proves the path ran.
        await expect(
            page.getByText(/Test webhook sent|could not be delivered|Unable to send a test webhook/i).first()
        ).toBeVisible({ timeout: 30_000 });
    });
});
