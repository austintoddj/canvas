import { afterEach, describe, expect, it, vi } from 'vitest';

import { isApplePlatform, searchShortcutKeys } from '@/lib/platform';

describe('platform', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('detects apple platforms', () => {
        vi.stubGlobal('navigator', { platform: 'MacIntel', userAgent: 'Mozilla/5.0' });

        expect(isApplePlatform()).toBe(true);
        expect(searchShortcutKeys()).toEqual(['⌘', 'K']);
    });

    it('detects non-apple platforms', () => {
        vi.stubGlobal('navigator', { platform: 'Win32', userAgent: 'Mozilla/5.0' });

        expect(isApplePlatform()).toBe(false);
        expect(searchShortcutKeys()).toEqual(['Ctrl', 'K']);
    });
});
