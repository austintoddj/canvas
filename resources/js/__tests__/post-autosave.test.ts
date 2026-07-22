import { describe, expect, it } from 'vitest';

import { shouldSkipStore } from '@/hooks/usePostAutosave';

describe('shouldSkipStore', () => {
    it('skips when the form matches the last save and promote is false', () => {
        expect(shouldSkipStore('same', 'same', false)).toBe(true);
    });

    it('does not skip when promote is true even if the form matches the last save', () => {
        expect(shouldSkipStore('same', 'same', true)).toBe(false);
    });

    it('does not skip when the form differs from the last save', () => {
        expect(shouldSkipStore('dirty', 'same', false)).toBe(false);
        expect(shouldSkipStore('dirty', 'same', true)).toBe(false);
    });

    it('does not skip when there is no last-saved baseline', () => {
        expect(shouldSkipStore('anything', null, false)).toBe(false);
        expect(shouldSkipStore('anything', null, true)).toBe(false);
    });
});
