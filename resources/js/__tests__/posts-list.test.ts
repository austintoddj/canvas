import { describe, expect, it } from 'vitest';

import {
    isPostPublished,
    parsePostsListFilters,
    postsIndexPath,
    postsIndexQueryParams,
} from '@/lib/posts/list';

describe('isPostPublished', () => {
    it('detects published posts from published_at', () => {
        expect(isPostPublished(null)).toBe(false);
        expect(isPostPublished('2099-01-01')).toBe(false);
        expect(isPostPublished('2020-01-01')).toBe(true);
    });
});

describe('parsePostsListFilters', () => {
    it('reads tab scope and page from search params', () => {
        const params = new URLSearchParams('type=draft&scope=all&page=3');

        expect(parsePostsListFilters(params)).toEqual({
            tab: 'draft',
            scope: 'all',
            page: 3,
        });
    });

    it('defaults to published user page 1', () => {
        expect(parsePostsListFilters(new URLSearchParams())).toEqual({
            tab: 'published',
            scope: 'user',
            page: 1,
        });
    });
});

describe('postsIndexPath', () => {
    it('builds SPA paths for list filters', () => {
        expect(postsIndexPath({ tab: 'published', scope: 'user', page: 1 })).toBe('/posts');
        expect(postsIndexPath({ tab: 'draft', scope: 'all', page: 2 })).toBe(
            '/posts?type=draft&scope=all&page=2'
        );
    });
});

describe('postsIndexQueryParams', () => {
    it('maps UI filters to API query params', () => {
        expect(postsIndexQueryParams({ tab: 'published', scope: 'user', page: 1 })).toEqual({});
        expect(postsIndexQueryParams({ tab: 'draft', scope: 'all', page: 3 })).toEqual({
            type: 'draft',
            scope: 'all',
            page: 3,
        });
    });
});