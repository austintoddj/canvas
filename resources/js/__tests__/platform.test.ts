import { afterEach, describe, expect, it, vi } from 'vitest';

import { isApplePlatform, searchShortcutKeys } from '@/lib/platform';

describe('platform helpers', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('detects Apple vs non-Apple shortcut labels', () => {
        vi.stubGlobal('navigator', { platform: 'MacIntel', userAgent: 'Mozilla/5.0' });
        expect(isApplePlatform()).toBe(true);
        expect(searchShortcutKeys()).toEqual(['⌘', 'K']);

        vi.stubGlobal('navigator', { platform: 'Win32', userAgent: 'Mozilla/5.0' });
        expect(isApplePlatform()).toBe(false);
        expect(searchShortcutKeys()).toEqual(['Ctrl', 'K']);
    });
});
