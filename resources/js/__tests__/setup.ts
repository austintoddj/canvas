import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

/**
 * Drain React 19's deferred passive-effect callback while the DOM environment is
 * still alive. React schedules that work with setImmediate and the callback
 * reads `window.event`; if happy-dom/jsdom is torn down first, Vitest reports an
 * unhandled "window is not defined" even though every assertion passed.
 *
 * Registered here (before test files import Testing Library) so LIFO afterEach
 * order runs this last — after RTL auto-cleanup unmounts and schedules passives.
 */
afterEach(async () => {
    if (typeof globalThis.window === 'undefined') {
        return;
    }

    await new Promise<void>((resolve) => {
        setImmediate(resolve);
    });
});
