import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { stubMatchMedia } from './helpers/dom';

/**
 * Motion cancels in-flight WAAPI animations on unmount / interrupt. The spec
 * rejects `animation.finished` with AbortError; happy-dom surfaces that as an
 * unhandled rejection even though every assertion passed.
 */
if (typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function') {
    const originalAnimate = Element.prototype.animate;

    Element.prototype.animate = function (this: Element, ...args: Parameters<Element['animate']>) {
        const animation = originalAnimate.apply(this, args);
        void animation.finished.catch((error: unknown) => {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }

            return Promise.reject(error);
        });
        return animation;
    };
}

if (typeof window !== 'undefined') {
    stubMatchMedia(() => false);
}

/**
 * Vitest is not using `globals: true`, so Testing Library does not register
 * auto-cleanup. Unmount here, then drain React 19's deferred passive-effect
 * callback while the DOM environment is still alive. React schedules that work
 * with setImmediate and the callback reads `window.event`; if happy-dom is torn
 * down first, Vitest reports an unhandled "window is not defined" even though
 * every assertion passed.
 */
afterEach(async () => {
    if (typeof globalThis.window === 'undefined') {
        return;
    }

    cleanup();
    localStorage.clear();
    document.documentElement.classList.remove('dark');

    await new Promise<void>((resolve) => {
        setImmediate(resolve);
    });
});
