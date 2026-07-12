import { describe, expect, it } from 'vitest';

import {
    normalizeResourceCollectionPage,
    parseUsersListFilters,
    setUserDetailParam,
    userDetailId,
    usersDetailPath,
    usersIndexPath,
    usersIndexQueryParams,
} from '@/lib/users/list';

describe('users list helpers', () => {
    it('parses filters, paths, and detail deep links', () => {
        expect(parseUsersListFilters(new URLSearchParams())).toEqual({ page: 1 });
        expect(parseUsersListFilters(new URLSearchParams('page=2'))).toEqual({ page: 2 });
        expect(usersIndexPath({ page: 1 })).toBe('/settings/users');
        expect(usersIndexPath({ page: 3 })).toBe('/settings/users?page=3');
        expect(usersIndexQueryParams({ page: 1 })).toEqual({});
        expect(usersIndexQueryParams({ page: 4 })).toEqual({ page: 4 });
        expect(userDetailId(new URLSearchParams())).toBeNull();
        expect(userDetailId(new URLSearchParams('detail=42'))).toBe('42');
        expect(setUserDetailParam(new URLSearchParams('page=2'), 7).get('detail')).toBe('7');
        expect(setUserDetailParam(new URLSearchParams('detail=9'), null).get('detail')).toBeNull();
        expect(usersDetailPath(12)).toBe('/settings/users?detail=12');
        expect(usersDetailPath(12, 3)).toBe('/settings/users?detail=12&page=3');
    });

    it('normalizes Laravel ResourceCollection and LengthAwarePaginator JSON', () => {
        const resourcePage = normalizeResourceCollectionPage({
            data: [{ id: 1 }],
            links: {
                first: 'https://example.test/users?page=1',
                last: 'https://example.test/users?page=2',
                prev: null,
                next: 'https://example.test/users?page=2',
            },
            meta: {
                current_page: 1,
                last_page: 2,
                per_page: 15,
                total: 16,
                from: 1,
                to: 15,
                path: 'https://example.test/users',
            },
        });

        expect(resourcePage.data).toEqual([{ id: 1 }]);
        expect(resourcePage.current_page).toBe(1);
        expect(resourcePage.next_page_url).toBe('https://example.test/users?page=2');
        expect(resourcePage.prev_page_url).toBeNull();

        const flatPage = normalizeResourceCollectionPage({
            data: [{ id: 2 }],
            current_page: 2,
            last_page: 3,
            per_page: 10,
            total: 25,
            from: 11,
            to: 20,
            first_page_url: '/u?page=1',
            last_page_url: '/u?page=3',
            next_page_url: '/u?page=3',
            prev_page_url: '/u?page=1',
            path: '/u',
            links: [],
        });

        expect(flatPage.current_page).toBe(2);
        expect(flatPage.total).toBe(25);
        expect(flatPage.prev_page_url).toBe('/u?page=1');
    });
});
