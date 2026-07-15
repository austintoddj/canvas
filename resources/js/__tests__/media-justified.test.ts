// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import {
    flattenJustifiedTiles,
    JUSTIFIED_GAP_PX,
    layoutJustifiedRows,
    unsplashPerPage,
    unsplashTargetRowHeight,
    type JustifiedItem,
} from '@/lib/media/justified';

function totalRowWidth(tiles: { width: number }[], gap: number): number {
    return tiles.reduce((sum, tile) => sum + tile.width, 0) + gap * Math.max(tiles.length - 1, 0);
}

describe('layoutJustifiedRows', () => {
    it('returns empty for empty items or non-positive container width', () => {
        expect(layoutJustifiedRows([], 800)).toEqual([]);
        expect(layoutJustifiedRows([{ id: 'a', width: 100, height: 100 }], 0)).toEqual([]);
        expect(layoutJustifiedRows([{ id: 'a', width: 100, height: 100 }], -10)).toEqual([]);
    });

    it('packs mixed aspects into full-width rows including the last row', () => {
        const items: JustifiedItem[] = [
            { id: '1', width: 1600, height: 900 },
            { id: '2', width: 900, height: 1200 },
            { id: '3', width: 1200, height: 800 },
            { id: '4', width: 800, height: 800 },
            { id: '5', width: 2000, height: 1000 },
        ];
        const containerWidth = 800;
        const gap = JUSTIFIED_GAP_PX;
        const rows = layoutJustifiedRows(items, containerWidth, { targetRowHeight: 160, gap });

        expect(rows.length).toBeGreaterThan(1);

        for (const row of rows) {
            expect(totalRowWidth(row.tiles, gap)).toBeCloseTo(containerWidth, 1);

            for (const tile of row.tiles) {
                expect(tile.height).toBeCloseTo(row.height, 5);
                expect(tile.width).toBeGreaterThan(0);
            }
        }

        const tiles = flattenJustifiedTiles(rows);
        expect(tiles.size).toBe(items.length);
        expect([...tiles.keys()].sort()).toEqual(items.map((item) => item.id).sort());
    });

    it('defaults missing or zero dimensions to a 4:3 aspect', () => {
        const rows = layoutJustifiedRows(
            [
                { id: 'a', width: null, height: null },
                { id: 'b', width: 0, height: 0 },
                { id: 'c', width: undefined, height: 100 },
            ],
            600,
            { targetRowHeight: 150, gap: 12 }
        );

        expect(rows.length).toBeGreaterThanOrEqual(1);

        for (const row of rows) {
            for (const tile of row.tiles) {
                expect(tile.width / tile.height).toBeCloseTo(4 / 3, 5);
            }
        }
    });

    it('justifies a single-item row to the full container width', () => {
        const rows = layoutJustifiedRows([{ id: 'solo', width: 100, height: 100 }], 1000, {
            targetRowHeight: 150,
            gap: 12,
        });

        expect(rows).toHaveLength(1);
        expect(rows[0].tiles).toHaveLength(1);
        expect(rows[0].tiles[0].width).toBeCloseTo(1000, 1);
        expect(rows[0].tiles[0].height).toBeCloseTo(1000, 1);
        expect(totalRowWidth(rows[0].tiles, 12)).toBeCloseTo(1000, 1);
    });
});

describe('unsplash density helpers', () => {
    it('maps density to row height and page size', () => {
        expect(unsplashTargetRowHeight('large')).toBeGreaterThan(unsplashTargetRowHeight('small'));
        expect(unsplashPerPage('small')).toBe(30);
        expect(unsplashPerPage('large')).toBe(18);
        expect(unsplashPerPage('large')).toBeLessThan(unsplashPerPage('small'));
    });
});
