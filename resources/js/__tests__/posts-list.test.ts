import { describe, expect, it } from 'vitest';

import {
    countsAfterPostDelete,
    isPostPublished,
    isPostScheduled,
    parsePostsListFilters,
    postListStatus,
    isPostEditorPath,
    POSTS_SEARCH_DEBOUNCE_MS,
    postsIndexPath,
    postsIndexQueryParams,
} from '@/lib/posts/list';

describe('posts list helpers', () => {
    it('decrements the matching tab count after delete', () => {
        expect(countsAfterPostDelete({ draftCount: 4, publishedCount: 7 }, 'draft')).toEqual({
            draftCount: 3,
            publishedCount: 7,
        });
        expect(countsAfterPostDelete({ draftCount: 4, publishedCount: 7 }, 'scheduled')).toEqual({
            draftCount: 3,
            publishedCount: 7,
        });
        expect(countsAfterPostDelete({ draftCount: 4, publishedCount: 7 }, 'published')).toEqual({
            draftCount: 4,
            publishedCount: 6,
        });
        expect(countsAfterPostDelete({ draftCount: 0, publishedCount: 0 }, 'draft')).toEqual({
            draftCount: 0,
            publishedCount: 0,
        });
    });

    it('detects published, scheduled, and draft posts and maps filters', () => {
        const now = new Date('2026-06-15T12:00:00.000Z');

        expect(isPostPublished(null, now)).toBe(false);
        expect(isPostScheduled(null, now)).toBe(false);
        expect(postListStatus(null, now)).toBe('draft');

        expect(isPostPublished('2099-01-01T00:00:00.000Z', now)).toBe(false);
        expect(isPostScheduled('2099-01-01T00:00:00.000Z', now)).toBe(true);
        expect(postListStatus('2099-01-01T00:00:00.000Z', now)).toBe('scheduled');

        // Naive / date-only wire values are rejected (not an absolute instant).
        expect(postListStatus('2099-01-01', now)).toBe('draft');
        expect(postListStatus('2026-06-15 12:01:00', now)).toBe('draft');

        expect(isPostPublished('2020-01-01T00:00:00.000Z', now)).toBe(true);
        expect(isPostScheduled('2020-01-01T00:00:00.000Z', now)).toBe(false);
        expect(postListStatus('2020-01-01T00:00:00.000Z', now)).toBe('published');

        expect(isPostPublished('2026-06-15T11:59:00.000Z', now)).toBe(true);
        expect(isPostScheduled('2026-06-15T12:01:00.000Z', now)).toBe(true);
        expect(postListStatus('2026-06-15T12:01:00.000Z', now)).toBe('scheduled');

        expect(POSTS_SEARCH_DEBOUNCE_MS).toBe(300);
        expect(parsePostsListFilters(new URLSearchParams())).toEqual({
            tab: 'published',
            scope: 'user',
            page: 1,
            search: '',
            sort: 'created',
        });
        expect(parsePostsListFilters(new URLSearchParams('type=draft&scope=all&page=3&search=%20hello%20'))).toEqual({
            tab: 'draft',
            scope: 'all',
            page: 3,
            search: 'hello',
            sort: 'created',
        });
        expect(parsePostsListFilters(new URLSearchParams('sort=published_asc')).sort).toBe('published_asc');
        expect(parsePostsListFilters(new URLSearchParams('sort=popular')).sort).toBe('created');

        expect(postsIndexPath({ tab: 'published', scope: 'user', page: 1 })).toBe('/posts');
        expect(postsIndexPath({ tab: 'draft', scope: 'all', page: 2, search: ' hello ' })).toBe(
            '/posts?type=draft&scope=all&page=2&search=hello'
        );
        expect(postsIndexPath({ sort: 'published' })).toBe('/posts?sort=published');
        expect(postsIndexPath({ sort: 'created' })).toBe('/posts');
        expect(
            postsIndexQueryParams({ tab: 'published', scope: 'user', page: 1, search: '  ', sort: 'created' })
        ).toEqual({});
        expect(
            postsIndexQueryParams({ tab: 'draft', scope: 'all', page: 3, search: 'hello', sort: 'activity_asc' })
        ).toEqual({
            type: 'draft',
            scope: 'all',
            page: 3,
            search: 'hello',
            sort: 'activity_asc',
        });
    });

    it('treats the post editor as the tight desktop well and leaves stats on the page well', () => {
        expect(isPostEditorPath('/posts/new')).toBe(true);
        expect(isPostEditorPath('/posts/post-1')).toBe(true);
        expect(isPostEditorPath('/posts')).toBe(false);
        expect(isPostEditorPath('/posts/post-1/stats')).toBe(false);
        expect(isPostEditorPath('/calendar')).toBe(false);
    });
});
