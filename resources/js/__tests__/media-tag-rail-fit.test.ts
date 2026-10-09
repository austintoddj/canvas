import { describe, expect, it } from 'vitest';

import { fitMediaTagRail, visibleMediaTags } from '@/lib/media/tag-rail';

const tags = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' },
    { id: 'd', name: 'D' },
    { id: 'e', name: 'E' },
];

function widths(values: Record<string, number>): Map<string, number> {
    return new Map(Object.entries(values));
}

describe('fitMediaTagRail', () => {
    const fixed = { available: 1000, fixedWidths: [50, 50], menuWidth: 20, gap: 10, minTagWidth: 48 };

    it('shows tags that fit and stops at the cap', () => {
        const widthById = widths({ a: 40, b: 40, c: 40, d: 40, e: 40 });

        expect(fitMediaTagRail(tags, null, widthById, { ...fixed, maxVisible: 3 }).tags.map((tag) => tag.id)).toEqual([
            'a',
            'b',
            'c',
        ]);
    });

    it('drops tags that do not fit at full width', () => {
        // Controls are 140px. One 40px tag needs 190px. Two need 240px.
        const fit = fitMediaTagRail(tags.slice(0, 3), null, widths({ a: 40, b: 40, c: 40 }), {
            ...fixed,
            available: 239,
            minTagWidth: 48,
        });

        expect(fit.tags.map((tag) => tag.id)).toEqual(['a']);
        expect(fit.truncateId).toBeNull();
        expect(fit.fixedOverflow).toBe(false);
    });

    it('truncates the next tag when leftover room stays readable', () => {
        const fit = fitMediaTagRail(tags.slice(0, 2), null, widths({ a: 40, b: 200 }), {
            ...fixed,
            available: 239,
            minTagWidth: 30,
        });

        expect(fit.tags.map((tag) => tag.id)).toEqual(['a', 'b']);
        expect(fit.truncateId).toBe('b');
        expect(fit.truncatePx).toBe(39);
    });

    it('pins a selected tag that would otherwise be hidden', () => {
        const widthById = widths({ a: 100, b: 100, c: 100, d: 100, e: 100 });
        const fit = fitMediaTagRail(tags, 'e', widthById, {
            available: 230,
            fixedWidths: [10, 10],
            menuWidth: 10,
            gap: 0,
            maxVisible: 2,
            minTagWidth: 48,
        });

        expect(fit.tags.map((tag) => tag.id)).toEqual(['e', 'a']);
    });

    it('keeps order when the selected tag already fits', () => {
        const fit = fitMediaTagRail(tags.slice(0, 3), 'b', widths({ a: 40, b: 40, c: 40 }), {
            ...fixed,
            available: 290,
        });

        expect(fit.tags.map((tag) => tag.id)).toEqual(['a', 'b', 'c']);
    });

    it('leaves a selected tag in the menu when the row cannot hold it', () => {
        const fit = fitMediaTagRail(tags, 'e', widths({ a: 100, b: 100, c: 100, d: 100, e: 400 }), {
            available: 140,
            fixedWidths: [50, 50],
            menuWidth: 20,
            gap: 10,
            maxVisible: 4,
            minTagWidth: 48,
        });

        expect(fit.tags).toEqual([]);
        expect(fit.truncateId).toBeNull();
    });

    it('reports when the fixed controls overflow the row', () => {
        const fit = fitMediaTagRail([], null, widths({}), {
            available: 100,
            fixedWidths: [80, 80],
            menuWidth: 36,
            gap: 8,
        });

        expect(fit.tags).toEqual([]);
        expect(fit.fixedOverflow).toBe(true);
    });
});

describe('visibleMediaTags', () => {
    it('returns every tag when the list is within the cap', () => {
        expect(visibleMediaTags(tags.slice(0, 2), 'b').map((tag) => tag.id)).toEqual(['a', 'b']);
    });

    it('pins the selected tag into the capped row', () => {
        expect(visibleMediaTags(tags, 'e', 4).map((tag) => tag.id)).toEqual(['e', 'a', 'b', 'c']);
    });
});
