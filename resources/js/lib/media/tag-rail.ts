export const MEDIA_TAG_RAIL_GAP_PX = 8;
export const MEDIA_TAG_RAIL_MAX_VISIBLE = 4;
/** A truncated pill stays wide enough to read a couple of characters. */
export const MEDIA_TAG_RAIL_MIN_TAG_PX = 48;

export type MediaTagRailFit<T extends { id: string }> = {
    tags: T[];
    truncateId: string | null;
    truncatePx: number | null;
    /** The All / Untagged controls themselves are wider than the row. */
    fixedOverflow: boolean;
};

type FitOptions = {
    available: number;
    fixedWidths: readonly number[];
    menuWidth: number;
    gap?: number;
    maxVisible?: number;
    minTagWidth?: number;
};

function rowWidth(
    fixedWidths: readonly number[],
    tagWidths: readonly number[],
    menuWidth: number,
    gap: number
): number {
    const itemCount = fixedWidths.length + tagWidths.length + 1;
    const fixedSum = fixedWidths.reduce((total, width) => total + width, 0);
    const tagSum = tagWidths.reduce((total, width) => total + width, 0);

    return fixedSum + tagSum + menuWidth + gap * Math.max(0, itemCount - 1);
}

function fitSequence(
    tagWidths: readonly number[],
    available: number,
    fixedWidths: readonly number[],
    menuWidth: number,
    gap: number,
    maxVisible: number,
    minTagWidth: number
): { count: number; truncateIndex: number | null; truncatePx: number | null } {
    const cap = Math.min(maxVisible, tagWidths.length);
    let count = 0;

    for (let next = 1; next <= cap; next += 1) {
        const widths = tagWidths.slice(0, next);

        if (rowWidth(fixedWidths, widths, menuWidth, gap) <= available) {
            count = next;
            continue;
        }

        const previous = rowWidth(fixedWidths, tagWidths.slice(0, next - 1), menuWidth, gap);
        const room = available - previous - gap;

        if (room >= minTagWidth) {
            return { count: next, truncateIndex: next - 1, truncatePx: room };
        }

        break;
    }

    return { count, truncateIndex: null, truncatePx: null };
}

function fitItems<T extends { id: string }>(
    items: readonly T[],
    widthById: ReadonlyMap<string, number>,
    available: number,
    fixedWidths: readonly number[],
    menuWidth: number,
    gap: number,
    maxVisible: number,
    minTagWidth: number
): MediaTagRailFit<T> {
    const widths = items.map((item) => widthById.get(item.id) ?? 0);
    const fitted = fitSequence(widths, available, fixedWidths, menuWidth, gap, maxVisible, minTagWidth);
    const truncateIndex = fitted.truncateIndex;

    return {
        tags: items.slice(0, fitted.count),
        truncateId: truncateIndex === null ? null : (items[truncateIndex]?.id ?? null),
        truncatePx: fitted.truncatePx,
        fixedOverflow: rowWidth(fixedWidths, [], menuWidth, gap) > available,
    };
}

/**
 * Pills that fit on one row beside the fixed controls. A selected tag that would
 * fall into the overflow menu is pinned first when there is room for it.
 */
export function fitMediaTagRail<T extends { id: string }>(
    tags: readonly T[],
    selectedTagId: string | null,
    widthById: ReadonlyMap<string, number>,
    options: FitOptions
): MediaTagRailFit<T> {
    const gap = options.gap ?? MEDIA_TAG_RAIL_GAP_PX;
    const maxVisible = options.maxVisible ?? MEDIA_TAG_RAIL_MAX_VISIBLE;
    const minTagWidth = options.minTagWidth ?? MEDIA_TAG_RAIL_MIN_TAG_PX;
    const fitted = fitItems(
        tags,
        widthById,
        options.available,
        options.fixedWidths,
        options.menuWidth,
        gap,
        maxVisible,
        minTagWidth
    );

    if (selectedTagId === null || fitted.tags.some((tag) => tag.id === selectedTagId)) {
        return fitted;
    }

    const selected = tags.find((tag) => tag.id === selectedTagId);

    if (selected === undefined) {
        return fitted;
    }

    return fitItems(
        [selected, ...tags.filter((tag) => tag.id !== selected.id)],
        widthById,
        options.available,
        options.fixedWidths,
        options.menuWidth,
        gap,
        maxVisible,
        minTagWidth
    );
}

/** Unmeasured fallback: cap the row and pin the selected tag. */
export function visibleMediaTags<T extends { id: string }>(
    tags: readonly T[],
    selectedTagId: string | null,
    limit = MEDIA_TAG_RAIL_MAX_VISIBLE
): T[] {
    if (limit <= 0) {
        return [];
    }

    if (tags.length <= limit) {
        return [...tags];
    }

    const selected = tags.find((tag) => tag.id === selectedTagId);

    if (selected === undefined) {
        return tags.slice(0, limit);
    }

    return [selected, ...tags.filter((tag) => tag.id !== selected.id)].slice(0, limit);
}
