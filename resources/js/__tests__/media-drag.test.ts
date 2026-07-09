import { describe, expect, it } from 'vitest';

import { applyDragDepth, isFileDragTypes, reducePageDrag } from '@/lib/media/drag';
import { isAllowedMediaFile, mediaFilesFromList } from '@/lib/media/list';

describe('isFileDragTypes', () => {
    it('detects Files in string arrays and array-likes', () => {
        expect(isFileDragTypes(['Files'])).toBe(true);
        expect(isFileDragTypes(['text/plain', 'Files'])).toBe(true);
        expect(isFileDragTypes(['text/plain'])).toBe(false);
        expect(isFileDragTypes([])).toBe(false);
        expect(isFileDragTypes(null)).toBe(false);
        expect(isFileDragTypes(undefined)).toBe(false);
    });

    it('uses DOMStringList-style contains when present', () => {
        const withFiles = {
            contains(type: string) {
                return type === 'Files';
            },
        };
        const withoutFiles = {
            contains() {
                return false;
            },
        };

        expect(isFileDragTypes(withFiles)).toBe(true);
        expect(isFileDragTypes(withoutFiles)).toBe(false);
    });
});

describe('applyDragDepth', () => {
    it('activates on enter and stays active across nested enter/leave', () => {
        let state = applyDragDepth(0, 'enter');
        expect(state).toEqual({ depth: 1, active: true });

        state = applyDragDepth(state.depth, 'enter');
        expect(state).toEqual({ depth: 2, active: true });

        state = applyDragDepth(state.depth, 'leave');
        expect(state).toEqual({ depth: 1, active: true });

        state = applyDragDepth(state.depth, 'leave');
        expect(state).toEqual({ depth: 0, active: false });
    });

    it('does not go negative and deactivates cleanly on reset', () => {
        expect(applyDragDepth(0, 'leave')).toEqual({ depth: 0, active: false });
        expect(applyDragDepth(3, 'reset')).toEqual({ depth: 0, active: false });
        expect(applyDragDepth(-2, 'enter')).toEqual({ depth: 1, active: true });
    });
});

describe('reducePageDrag', () => {
    it('enter then leave before any UI re-render still deactivates (depth-only leave)', () => {
        // Mirrors the stuck-overlay bug: enter increments depth; leave must not
        // require a lagged React `pageDragging === true` flag.
        let depth = 0;

        const entered = reducePageDrag({
            depth,
            kind: 'enter',
            isFileDrag: true,
            uploading: false,
        });
        depth = entered.depth;
        expect(entered.accept).toBe(true);
        expect(entered.active).toBe(true);
        expect(depth).toBe(1);

        // Leave uses depth only — even if a UI layer still thought active was false.
        const left = reducePageDrag({
            depth,
            kind: 'leave',
            isFileDrag: true,
            uploading: false,
        });
        expect(left).toMatchObject({ depth: 0, active: false });
    });

    it('nested enter/leave does not false-deactivate mid-surface', () => {
        let depth = 0;

        depth = reducePageDrag({ depth, kind: 'enter', isFileDrag: true, uploading: false }).depth;
        depth = reducePageDrag({ depth, kind: 'enter', isFileDrag: true, uploading: false }).depth;
        expect(depth).toBe(2);

        const mid = reducePageDrag({ depth, kind: 'leave', isFileDrag: true, uploading: false });
        expect(mid).toMatchObject({ depth: 1, active: true });

        const out = reducePageDrag({ depth: mid.depth, kind: 'leave', isFileDrag: true, uploading: false });
        expect(out).toMatchObject({ depth: 0, active: false });
    });

    it('drop resets and requests upload when allowed; skips upload while uploading', () => {
        const drop = reducePageDrag({
            depth: 2,
            kind: 'drop',
            isFileDrag: true,
            uploading: false,
        });
        expect(drop).toEqual({ depth: 0, active: false, accept: true, shouldUpload: true });

        const busy = reducePageDrag({
            depth: 1,
            kind: 'drop',
            isFileDrag: true,
            uploading: true,
        });
        expect(busy).toEqual({ depth: 0, active: false, accept: true, shouldUpload: false });

        const notFiles = reducePageDrag({
            depth: 1,
            kind: 'drop',
            isFileDrag: false,
            uploading: false,
        });
        expect(notFiles.accept).toBe(false);
        expect(notFiles.shouldUpload).toBe(false);
        expect(notFiles.active).toBe(false);
        expect(notFiles.depth).toBe(0);
    });

    it('end clears stuck depth when OS drag cancels outside the page', () => {
        const ended = reducePageDrag({
            depth: 3,
            kind: 'end',
            isFileDrag: true,
            uploading: false,
        });
        expect(ended).toEqual({ depth: 0, active: false, accept: false, shouldUpload: false });
    });

    it('ignores non-file enter and uploading enter', () => {
        expect(reducePageDrag({ depth: 0, kind: 'enter', isFileDrag: false, uploading: false })).toMatchObject({
            depth: 0,
            active: false,
            accept: false,
        });

        expect(reducePageDrag({ depth: 0, kind: 'enter', isFileDrag: true, uploading: true })).toMatchObject({
            depth: 0,
            active: false,
            accept: false,
        });
    });
});

describe('media file selection from lists', () => {
    it('keeps allowed images and drops disallowed types for multi-file drops', () => {
        const jpeg = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });
        const png = new File([new Uint8Array(4)], 'b.png', { type: 'image/png' });
        const gif = new File([new Uint8Array(4)], 'c.gif', { type: 'image/gif' });
        const webp = new File([new Uint8Array(4)], 'd.webp', { type: 'image/webp' });
        const pdf = new File([new Uint8Array(4)], 'e.pdf', { type: 'application/pdf' });
        const text = new File([new Uint8Array(4)], 'f.txt', { type: 'text/plain' });

        expect(isAllowedMediaFile(jpeg)).toBe(true);
        expect(isAllowedMediaFile(pdf)).toBe(false);

        const kept = mediaFilesFromList([jpeg, pdf, png, text, gif, webp]);

        expect(kept).toEqual([jpeg, png, gif, webp]);
        expect(mediaFilesFromList([pdf, text])).toEqual([]);
        expect(mediaFilesFromList(null)).toEqual([]);
        expect(mediaFilesFromList(undefined)).toEqual([]);
    });
});
