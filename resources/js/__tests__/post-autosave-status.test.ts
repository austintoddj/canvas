import { describe, expect, it } from 'vitest';

import { SAVE_STATUS_MIN_SAVING_MS, SAVE_STATUS_SAVED_MS } from '@/hooks/usePostAutosave';
import { navSaveStatusLabel } from '@/lib/posts/form';

describe('post autosave status chrome', () => {
    it('exposes timing constants for ephemeral Saving/Saved', () => {
        expect(SAVE_STATUS_MIN_SAVING_MS).toBeGreaterThanOrEqual(300);
        expect(SAVE_STATUS_SAVED_MS).toBeGreaterThanOrEqual(2000);
    });

    it('only surfaces saving, saved, and error in the nav', () => {
        expect(navSaveStatusLabel('idle')).toBeNull();
        expect(navSaveStatusLabel('pending')).toBeNull();
        expect(navSaveStatusLabel('saving')).toBe('Saving…');
        expect(navSaveStatusLabel('saved')).toBe('Saved');
        expect(navSaveStatusLabel('error')).toBe('Save failed');
    });
});
