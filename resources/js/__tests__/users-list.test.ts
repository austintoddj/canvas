import { describe, expect, it } from 'vitest';

import usersEmptyVisualSource from '@/components/users/UsersEmptyVisual.tsx?raw';
import {
    normalizeResourceCollectionPage,
    parseUsersListFilters,
    usersIndexPath,
    usersIndexQueryParams,
} from '@/lib/users/list';
import usersIndexSource from '@/pages/Settings/Users/Index.tsx?raw';

describe('parseUsersListFilters', () => {
    it('reads page from search params', () => {
        expect(parseUsersListFilters(new URLSearchParams('page=2'))).toEqual({ page: 2 });
        expect(parseUsersListFilters(new URLSearchParams())).toEqual({ page: 1 });
    });
});

describe('usersIndexPath / usersIndexQueryParams', () => {
    it('builds SPA paths and API params', () => {
        expect(usersIndexPath({ page: 1 })).toBe('/settings/users');
        expect(usersIndexPath({ page: 3 })).toBe('/settings/users?page=3');
        expect(usersIndexQueryParams({ page: 1 })).toEqual({});
        expect(usersIndexQueryParams({ page: 4 })).toEqual({ page: 4 });
    });
});

describe('normalizeResourceCollectionPage', () => {
    it('maps Laravel ResourceCollection meta pagination into Paginated', () => {
        const page = normalizeResourceCollectionPage({
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

        expect(page.data).toEqual([{ id: 1 }]);
        expect(page.current_page).toBe(1);
        expect(page.last_page).toBe(2);
        expect(page.per_page).toBe(15);
        expect(page.total).toBe(16);
        expect(page.next_page_url).toBe('https://example.test/users?page=2');
        expect(page.prev_page_url).toBeNull();
    });

    it('passes through flat LengthAwarePaginator JSON', () => {
        const page = normalizeResourceCollectionPage({
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

        expect(page.current_page).toBe(2);
        expect(page.last_page).toBe(3);
        expect(page.total).toBe(25);
        expect(page.prev_page_url).toBe('/u?page=1');
    });
});

describe('users list empty state (shipped source)', () => {
    it('uses a designed empty visual instead of a single icon tile', () => {
        expect(usersIndexSource).toContain('EmptyState');
        expect(usersIndexSource).toContain('UsersEmptyVisual');
        expect(usersIndexSource).not.toContain('UsersIcon');
        expect(usersEmptyVisualSource).toContain('data-users-empty-visual');
    });

    it('soft-reveals filled lists and lifts empty states without animating page chrome', () => {
        expect(usersIndexSource).toContain('ContentReveal');
        expect(usersIndexSource).toContain('busy={refreshing}');
        expect(usersIndexSource).toContain('EmptyStateReveal');
        expect(usersIndexSource).toContain('TableListSkeleton');
    });
});
