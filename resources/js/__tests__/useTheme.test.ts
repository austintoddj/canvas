// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyTheme, resolveInitialMode } from '@/hooks/useTheme';

// Mock matchMedia
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

describe('resolveInitialMode', () => {
    let storage: Record<string, string>;

    beforeEach(() => {
        storage = {};
        vi.stubGlobal('localStorage', {
            getItem: (k: string) => storage[k] ?? null,
            setItem: (k: string, v: string) => {
                storage[k] = v;
            },
            removeItem: (k: string) => {
                delete storage[k];
            },
            clear: () => {
                Object.keys(storage).forEach((k) => delete storage[k]);
            },
        });
    });

    afterEach(() => vi.unstubAllGlobals());

    it('returns stored localStorage value when valid', () => {
        localStorage.setItem('canvas-theme', 'dark');
        expect(resolveInitialMode('system')).toBe('dark');
    });

    it('returns server theme when no localStorage value is set', () => {
        expect(resolveInitialMode('light')).toBe('light');
    });

    it('ignores invalid localStorage values and falls back to server theme', () => {
        localStorage.setItem('canvas-theme', 'invalid');
        expect(resolveInitialMode('dark')).toBe('dark');
    });

    it('defaults to system when no localStorage and no server theme', () => {
        expect(resolveInitialMode(undefined)).toBe('system');
    });

    it('prefers localStorage over server theme', () => {
        localStorage.setItem('canvas-theme', 'light');
        expect(resolveInitialMode('dark')).toBe('light');
    });
});

describe('applyTheme', () => {
    beforeEach(() => {
        document.documentElement.classList.remove('dark');
    });

    afterEach(() => {
        document.documentElement.classList.remove('dark');
    });

    it('adds dark class for dark mode', () => {
        applyTheme('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class for light mode', () => {
        document.documentElement.classList.add('dark');
        applyTheme('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('adds dark class for system mode when OS prefers dark', () => {
        mockMatchMedia(true);
        applyTheme('system');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class for system mode when OS prefers light', () => {
        mockMatchMedia(false);
        document.documentElement.classList.add('dark');
        applyTheme('system');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
});
