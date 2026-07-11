import { describe, expect, it } from 'vitest';

import {
    pageQueryParam,
    paginationWindow,
    parsePageParam,
    shouldGoToPreviousPageAfterDelete,
} from '@/lib/list-pagination';

describe('parsePageParam / pageQueryParam', () => {
    it('parses and omits default page', () => {
        expect(parsePageParam(new URLSearchParams('page=3'))).toBe(3);
        expect(parsePageParam(new URLSearchParams())).toBe(1);
        expect(pageQueryParam(1)).toBeUndefined();
        expect(pageQueryParam(2)).toBe(2);
    });
});

describe('paginationWindow', () => {
    it('returns all pages when few', () => {
        expect(paginationWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('inserts gaps for long ranges', () => {
        expect(paginationWindow(5, 12)).toEqual([1, 'gap', 4, 5, 6, 'gap', 12]);
    });
});

describe('shouldGoToPreviousPageAfterDelete', () => {
    it('only goes back when the last item on a later page is removed', () => {
        expect(shouldGoToPreviousPageAfterDelete(1, 2)).toBe(true);
        expect(shouldGoToPreviousPageAfterDelete(1, 1)).toBe(false);
        expect(shouldGoToPreviousPageAfterDelete(2, 2)).toBe(false);
    });
});
