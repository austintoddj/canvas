import { describe, expect, it } from 'vitest';

import {
    isPostPublished,
    isPostScheduled,
    parsePostsListFilters,
    postListStatus,
    postsIndexPath,
    postsIndexQueryParams,
} from '@/lib/posts/list';

describe('posts list helpers', () => {
    it('detects published, scheduled, and draft posts and maps filters', () => {
        const now = new Date(2026, 5, 15, 12, 0, 0);

        expect(isPostPublished(null, now)).toBe(false);
        expect(isPostScheduled(null, now)).toBe(false);
        expect(postListStatus(null, now)).toBe('draft');

        expect(isPostPublished('2099-01-01', now)).toBe(false);
        expect(isPostScheduled('2099-01-01', now)).toBe(true);
        expect(postListStatus('2099-01-01', now)).toBe('scheduled');

        expect(isPostPublished('2020-01-01', now)).toBe(true);
        expect(isPostPublished('2020-01-01T00:00:00.000000Z', now)).toBe(true);
        expect(isPostScheduled('2020-01-01T00:00:00.000000Z', now)).toBe(false);
        expect(postListStatus('2020-01-01', now)).toBe('published');

        expect(isPostPublished('2026-06-15 11:59:00', now)).toBe(true);
        expect(isPostScheduled('2026-06-15 12:01:00', now)).toBe(true);
        expect(postListStatus('2026-06-15 12:01:00', now)).toBe('scheduled');

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
