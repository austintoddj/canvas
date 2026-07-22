import { describe, expect, it } from 'vitest';

import { SAVE_STATUS_MIN_SAVING_MS, SAVE_STATUS_SAVED_MS } from '@/hooks/usePostAutosave';
import { editorSaveActivityLabel, editorStatusBadge, navSaveStatusLabel } from '@/lib/posts/form';

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

    it('keeps Draft/Scheduled badge stable and shows save activity beside it', () => {
        expect(editorStatusBadge('draft', false)).toMatchObject({ color: 'amber', label: 'Draft' });
        expect(editorSaveActivityLabel('saving', 'draft')).toBe('Saving…');
        expect(editorSaveActivityLabel('saved', 'draft')).toBe('Saved');
        expect(editorStatusBadge('draft', false).label).toBe('Draft');
    });

    it('uses Published ↔ Pending edits on live posts with no save text', () => {
        expect(editorStatusBadge('published', false)).toMatchObject({ color: 'green', label: 'Published' });
        expect(editorStatusBadge('published', true)).toMatchObject({ color: 'amber', label: 'Pending edits' });
        expect(editorSaveActivityLabel('saving', 'published')).toBeNull();
        expect(editorSaveActivityLabel('saved', 'published')).toBeNull();
    });
});
