// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyTheme, resolveInitialMode } from '@/hooks/useTheme';

function mockMatchMedia(prefersDark: boolean) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })),
    });
}

describe('theme helpers', () => {
    let storage: Record<string, string>;

    beforeEach(() => {
        storage = {};
        document.documentElement.classList.remove('dark');
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => storage[key] ?? null,
            setItem: (key: string, value: string) => {
                storage[key] = value;
            },
            removeItem: (key: string) => {
                delete storage[key];
            },
            clear: () => {
                storage = {};
            },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        document.documentElement.classList.remove('dark');
    });

    it('resolves initial mode from localStorage then server theme', () => {
        localStorage.setItem('canvas-theme', 'dark');
        expect(resolveInitialMode('system')).toBe('dark');

        storage = {};
        expect(resolveInitialMode('light')).toBe('light');

        localStorage.setItem('canvas-theme', 'invalid');
        expect(resolveInitialMode('dark')).toBe('dark');

        storage = {};
        expect(resolveInitialMode(undefined)).toBe('system');

        localStorage.setItem('canvas-theme', 'light');
        expect(resolveInitialMode('dark')).toBe('light');
    });

    it('applies dark class for dark and system preferences', () => {
        applyTheme('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        applyTheme('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);

        mockMatchMedia(true);
        applyTheme('system');
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        mockMatchMedia(false);
        applyTheme('system');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
});
