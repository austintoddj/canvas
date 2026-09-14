// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyTheme, resolveInitialMode } from '@/hooks/useTheme';

import { stubMatchMedia } from './helpers/dom';

describe('theme helpers', () => {
    beforeEach(() => {
        document.documentElement.classList.remove('dark');
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('dark');
    });

    it('resolves initial mode from localStorage then server theme', () => {
        localStorage.setItem('canvas-theme', 'dark');
        expect(resolveInitialMode('system')).toBe('dark');

        localStorage.clear();
        expect(resolveInitialMode('light')).toBe('light');

        localStorage.setItem('canvas-theme', 'invalid');
        expect(resolveInitialMode('dark')).toBe('dark');

        localStorage.clear();
        expect(resolveInitialMode(undefined)).toBe('system');

        localStorage.setItem('canvas-theme', 'light');
        expect(resolveInitialMode('dark')).toBe('light');
    });

    it('applies dark class for dark and system preferences', () => {
        applyTheme('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        applyTheme('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);

        stubMatchMedia((query) => query === '(prefers-color-scheme: dark)');
        applyTheme('system');
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        stubMatchMedia(() => false);
        applyTheme('system');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
});
