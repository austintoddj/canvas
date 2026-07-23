import { describe, expect, it } from 'vitest';

import {
    pageQueryParam,
    paginationWindow,
    parsePageParam,
    shouldGoToPreviousPageAfterDelete,
} from '@/lib/list-pagination';

describe('list pagination helpers', () => {
    it('parses pages, builds windows, and decides post-delete page moves', () => {
        expect(parsePageParam(new URLSearchParams('page=3'))).toBe(3);
        expect(parsePageParam(new URLSearchParams())).toBe(1);
        expect(pageQueryParam(1)).toBeUndefined();
        expect(pageQueryParam(2)).toBe(2);

        expect(paginationWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
        expect(paginationWindow(5, 12)).toEqual([1, 'gap', 4, 5, 6, 'gap', 12]);

        expect(shouldGoToPreviousPageAfterDelete(1, 2)).toBe(true);
        expect(shouldGoToPreviousPageAfterDelete(1, 1)).toBe(false);
        expect(shouldGoToPreviousPageAfterDelete(2, 2)).toBe(false);
    });
});
