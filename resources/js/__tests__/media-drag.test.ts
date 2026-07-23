import { describe, expect, it } from 'vitest';

import { applyDragDepth, isFileDragTypes, reducePageDrag } from '@/lib/media/drag';

describe('media drag helpers', () => {
    it('detects file drags and tracks nested drag depth', () => {
        expect(isFileDragTypes(['Files'])).toBe(true);
        expect(isFileDragTypes(['text/plain'])).toBe(false);
        expect(isFileDragTypes(null)).toBe(false);
        expect(isFileDragTypes({ contains: (type: string) => type === 'Files' })).toBe(true);

        let state = applyDragDepth(0, 'enter');
        expect(state).toEqual({ depth: 1, active: true });
        state = applyDragDepth(state.depth, 'enter');
        expect(state).toEqual({ depth: 2, active: true });
        state = applyDragDepth(state.depth, 'leave');
        expect(state).toEqual({ depth: 1, active: true });
        state = applyDragDepth(state.depth, 'leave');
        expect(state).toEqual({ depth: 0, active: false });
        expect(applyDragDepth(3, 'reset')).toEqual({ depth: 0, active: false });
    });

    it('reduces page drag events without stuck overlays or false uploads', () => {
        let depth = reducePageDrag({ depth: 0, kind: 'enter', isFileDrag: true, uploading: false }).depth;
        expect(depth).toBe(1);
        expect(reducePageDrag({ depth, kind: 'leave', isFileDrag: true, uploading: false })).toMatchObject({
            depth: 0,
            active: false,
        });

        depth = reducePageDrag({ depth: 0, kind: 'enter', isFileDrag: true, uploading: false }).depth;
        depth = reducePageDrag({ depth, kind: 'enter', isFileDrag: true, uploading: false }).depth;
        expect(reducePageDrag({ depth, kind: 'leave', isFileDrag: true, uploading: false })).toMatchObject({
            depth: 1,
            active: true,
        });

        expect(reducePageDrag({ depth: 2, kind: 'drop', isFileDrag: true, uploading: false })).toEqual({
            depth: 0,
            active: false,
            accept: true,
            shouldUpload: true,
        });
        expect(reducePageDrag({ depth: 1, kind: 'drop', isFileDrag: true, uploading: true }).shouldUpload).toBe(false);
        expect(reducePageDrag({ depth: 0, kind: 'enter', isFileDrag: false, uploading: false }).accept).toBe(false);
        expect(reducePageDrag({ depth: 3, kind: 'end', isFileDrag: true, uploading: false })).toEqual({
            depth: 0,
            active: false,
            accept: false,
            shouldUpload: false,
        });
    });
});
