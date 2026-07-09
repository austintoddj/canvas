export type DragDepthAction = 'enter' | 'leave' | 'reset';

export type DragDepthState = {
    depth: number;
    active: boolean;
};

export type PageDragEventKind = 'enter' | 'leave' | 'over' | 'drop' | 'end';

export type PageDragInput = {
    depth: number;
    kind: PageDragEventKind;
    isFileDrag: boolean;
    uploading: boolean;
};

export type PageDragResult = {
    depth: number;
    active: boolean;
    /** Whether the caller should preventDefault / set dropEffect. */
    accept: boolean;
    /** Whether a drop should hand files to the upload path. */
    shouldUpload: boolean;
};

/**
 * Whether a drag event carries files from the OS (vs. in-app drag of other data).
 * Accepts `DataTransfer.types` (DOMStringList), string arrays, and array-likes.
 */
export function isFileDragTypes(
    types: ArrayLike<string> | { contains(type: string): boolean } | null | undefined
): boolean {
    if (types == null) {
        return false;
    }

    if (typeof (types as { contains?: unknown }).contains === 'function') {
        return (types as { contains(type: string): boolean }).contains('Files');
    }

    return Array.from(types as ArrayLike<string>).includes('Files');
}

/**
 * Nested enter/leave depth counter so drag-active does not flicker when the
 * pointer crosses child elements, and clears cleanly on drop or leave-to-zero.
 */
export function applyDragDepth(depth: number, action: DragDepthAction): DragDepthState {
    if (action === 'reset') {
        return { depth: 0, active: false };
    }

    if (action === 'enter') {
        const next = Math.max(0, depth) + 1;

        return { depth: next, active: true };
    }

    const next = Math.max(0, depth - 1);

    return { depth: next, active: next > 0 };
}

/**
 * Page-level file-drag state machine used by the Media library surface.
 *
 * Important: leave is keyed off the depth ref only — never a lagged React
 * `dragging` boolean — so enter→leave before re-render still deactivates.
 * `end` covers OS cancel / drop outside the page (dragend, window blur, etc.).
 */
export function reducePageDrag(input: PageDragInput): PageDragResult {
    const { depth, kind, isFileDrag, uploading } = input;

    if (kind === 'end' || kind === 'drop') {
        const cleared = applyDragDepth(depth, 'reset');

        return {
            depth: cleared.depth,
            active: cleared.active,
            accept: kind === 'drop' && isFileDrag,
            shouldUpload: kind === 'drop' && isFileDrag && !uploading,
        };
    }

    if (kind === 'enter') {
        if (!isFileDrag || uploading) {
            return { depth, active: depth > 0, accept: false, shouldUpload: false };
        }

        const next = applyDragDepth(depth, 'enter');

        return { depth: next.depth, active: next.active, accept: true, shouldUpload: false };
    }

    if (kind === 'leave') {
        // Always decrement when depth > 0, even if UI has not painted active yet.
        if (depth <= 0) {
            return { depth: 0, active: false, accept: false, shouldUpload: false };
        }

        const next = applyDragDepth(depth, 'leave');

        return { depth: next.depth, active: next.active, accept: true, shouldUpload: false };
    }

    // over
    if (!isFileDrag || uploading) {
        return { depth, active: depth > 0, accept: false, shouldUpload: false };
    }

    return { depth, active: depth > 0, accept: true, shouldUpload: false };
}
