import { expect, type Page } from '@playwright/test';

export const SMOKE_EMAIL = 'smoke@example.com';
export const CONTRIBUTOR_EMAIL = 'contributor@example.com';

/** Session login for a host user seeded by install-smoke / e2e-prepare. */
export async function loginAs(page: Page, email: string): Promise<void> {
    await page.goto(`/__canvas_e2e/login/${encodeURIComponent(email)}`);
    await expect(page.locator('#canvas')).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/canvas\/?$/);
}

/** Session login for the install-smoke admin user. */
export async function loginAsAdmin(page: Page, email = SMOKE_EMAIL): Promise<void> {
    await loginAs(page, email);
}

/** Session login for the install-smoke contributor user. */
export async function loginAsContributor(page: Page, email = CONTRIBUTOR_EMAIL): Promise<void> {
    await loginAs(page, email);
}
