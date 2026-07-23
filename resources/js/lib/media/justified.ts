export type JustifiedItem = {
    id: string;
    width: number | null | undefined;
    height: number | null | undefined;
};

export type JustifiedTile = {
    id: string;
    width: number;
    height: number;
};

export type JustifiedRow = {
    tiles: JustifiedTile[];
    height: number;
};

export const JUSTIFIED_GAP_PX = 12;
export const JUSTIFIED_TARGET_ROW_HEIGHT_DIALOG = 148;
export const JUSTIFIED_TARGET_ROW_HEIGHT_PAGE = 180;
export const JUSTIFIED_TARGET_ROW_HEIGHT_UNSPLASH_SMALL = 148;
export const JUSTIFIED_TARGET_ROW_HEIGHT_UNSPLASH_LARGE = 248;
export const UNSPLASH_PER_PAGE_SMALL = 30;
export const UNSPLASH_PER_PAGE_LARGE = 18;
export const JUSTIFIED_DEFAULT_ASPECT_WIDTH = 4;
export const JUSTIFIED_DEFAULT_ASPECT_HEIGHT = 3;

export type UnsplashGridDensity = 'small' | 'large';

export function unsplashTargetRowHeight(density: UnsplashGridDensity): number {
    return density === 'large'
        ? JUSTIFIED_TARGET_ROW_HEIGHT_UNSPLASH_LARGE
        : JUSTIFIED_TARGET_ROW_HEIGHT_UNSPLASH_SMALL;
}

export function unsplashPerPage(density: UnsplashGridDensity): number {
    return density === 'large' ? UNSPLASH_PER_PAGE_LARGE : UNSPLASH_PER_PAGE_SMALL;
}

function aspectRatio(item: JustifiedItem): number {
    const width = item.width;
    const height = item.height;

    if (width == null || width <= 0 || height == null || height <= 0) {
        return JUSTIFIED_DEFAULT_ASPECT_WIDTH / JUSTIFIED_DEFAULT_ASPECT_HEIGHT;
    }

    return width / height;
}

/**
 * Pack images into justified rows (Google Photos style).
 * Every row — including the last — scales to fill container width flush.
 */
export function layoutJustifiedRows(
    items: readonly JustifiedItem[],
    containerWidth: number,
    options: {
        targetRowHeight?: number;
        gap?: number;
    } = {}
): JustifiedRow[] {
    if (items.length === 0 || containerWidth <= 0) {
        return [];
    }

    const targetRowHeight = options.targetRowHeight ?? JUSTIFIED_TARGET_ROW_HEIGHT_PAGE;
    const gap = options.gap ?? JUSTIFIED_GAP_PX;

    const rows: JustifiedRow[] = [];
    let rowItems: JustifiedItem[] = [];
    let rowAspectSum = 0;

    function flushRow(): void {
        if (rowItems.length === 0) {
            return;
        }

        const gapsWidth = gap * (rowItems.length - 1);
        const available = Math.max(containerWidth - gapsWidth, 1);
        const height = available / rowAspectSum;

        rows.push({
            height,
            tiles: rowItems.map((item) => {
                const ratio = aspectRatio(item);

                return {
                    id: item.id,
                    width: ratio * height,
                    height,
                };
            }),
        });

        rowItems = [];
        rowAspectSum = 0;
    }

    for (const item of items) {
        const ratio = aspectRatio(item);
        const nextAspectSum = rowAspectSum + ratio;
        const nextGaps = gap * rowItems.length;
        const nextWidthAtTarget = nextAspectSum * targetRowHeight + nextGaps;

        if (rowItems.length > 0 && nextWidthAtTarget > containerWidth) {
            flushRow();
        }

        rowItems.push(item);
        rowAspectSum += ratio;
    }

    flushRow();

    return rows;
}

export function flattenJustifiedTiles(rows: readonly JustifiedRow[]): Map<string, JustifiedTile> {
    const map = new Map<string, JustifiedTile>();

    for (const row of rows) {
        for (const tile of row.tiles) {
            map.set(tile.id, tile);
        }
    }

    return map;
}
