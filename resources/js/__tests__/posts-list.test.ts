import { describe, expect, it } from 'vitest';

import { isPostPublished, parsePostsListFilters, postsIndexPath, postsIndexQueryParams } from '@/lib/posts/list';

describe('posts list helpers', () => {
    it('detects published posts and maps filters to paths and API params', () => {
        expect(isPostPublished(null)).toBe(false);
        expect(isPostPublished('2099-01-01')).toBe(false);
        expect(isPostPublished('2020-01-01')).toBe(true);
        expect(isPostPublished('2020-01-01T00:00:00.000000Z')).toBe(true);

        expect(parsePostsListFilters(new URLSearchParams())).toEqual({
            tab: 'published',
            scope: 'user',
            page: 1,
        });
        expect(parsePostsListFilters(new URLSearchParams('type=draft&scope=all&page=3'))).toEqual({
            tab: 'draft',
            scope: 'all',
            page: 3,
        });

        expect(postsIndexPath({ tab: 'published', scope: 'user', page: 1 })).toBe('/posts');
        expect(postsIndexPath({ tab: 'draft', scope: 'all', page: 2 })).toBe('/posts?type=draft&scope=all&page=2');
        expect(postsIndexQueryParams({ tab: 'published', scope: 'user', page: 1 })).toEqual({});
        expect(postsIndexQueryParams({ tab: 'draft', scope: 'all', page: 3 })).toEqual({
            type: 'draft',
            scope: 'all',
            page: 3,
        });
    });
});
