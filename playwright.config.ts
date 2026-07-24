import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const hostMarker = path.join(rootDir, '.e2e-host');
const hostFromEnv = process.env.E2E_HOST_DIR?.trim();
const hostDir =
    hostFromEnv && hostFromEnv.length > 0
        ? hostFromEnv
        : fs.existsSync(hostMarker)
          ? fs.readFileSync(hostMarker, 'utf8').trim()
          : '';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8765';

if (!hostDir && process.env.PLAYWRIGHT_SKIP_WEBSERVER !== '1') {
    console.warn(
        'No E2E host directory found. Run `npm run e2e:prepare` (or set E2E_HOST_DIR) before e2e tests.'
    );
}

export default defineConfig({
    // Browser journeys against a real host app (not Pest/Vitest).
    // Lives under tests/e2e so all automated tests share one tests/ tree.
    testDir: './tests/e2e',
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    timeout: 60_000,
    expect: {
        timeout: 15_000,
    },
    use: {
        baseURL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        ...devices['Desktop Chrome'],
    },
    webServer: hostDir
        ? {
              command: `php artisan serve --host=127.0.0.1 --port=8765`,
              cwd: hostDir,
              url: `${baseURL}/__canvas_e2e/health`,
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
          }
        : undefined,
});
