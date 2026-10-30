import { describe, expect, it } from 'vitest';

import {
    countsAfterPostDelete,
    isPostPublished,
    isPostScheduled,
    parsePostsListFilters,
    parsePostsListSort,
    postListSortInstant,
    postListStatus,
    postsIndexPath,
    postsIndexQueryParams,
    POSTS_SORT_OPTIONS,
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

        expect(parsePostsListFilters(new URLSearchParams())).toEqual({
            tab: 'published',
            scope: 'user',
            page: 1,
            sort: 'created',
        });
        expect(parsePostsListFilters(new URLSearchParams('type=draft&scope=all&page=3'))).toEqual({
            tab: 'draft',
            scope: 'all',
            page: 3,
            sort: 'created',
        });

        expect(postsIndexPath({ tab: 'published', scope: 'user', page: 1 })).toBe('/posts');
        expect(postsIndexPath({ tab: 'draft', scope: 'all', page: 2 })).toBe('/posts?type=draft&scope=all&page=2');
        expect(postsIndexQueryParams({ tab: 'published', scope: 'user', page: 1, sort: 'created' })).toEqual({});
        expect(postsIndexQueryParams({ tab: 'draft', scope: 'all', page: 3, sort: 'created' })).toEqual({
            type: 'draft',
            scope: 'all',
            page: 3,
        });
    });

    it('shows the timestamp for the active sort, with no date for unpublished drafts', () => {
        const post = {
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-03-01T00:00:00.000Z',
            published_at: '2026-02-01T00:00:00.000Z' as string | null,
        };

        expect(postListSortInstant(post, 'created')).toBe(post.created_at);
        expect(postListSortInstant(post, 'created_oldest')).toBe(post.created_at);
        expect(postListSortInstant(post, 'updated')).toBe(post.updated_at);
        expect(postListSortInstant(post, 'updated_oldest')).toBe(post.updated_at);
        expect(postListSortInstant(post, 'published')).toBe(post.published_at);
        expect(postListSortInstant(post, 'published_oldest')).toBe(post.published_at);
        expect(postListSortInstant({ ...post, published_at: null }, 'published')).toBeNull();
    });

    it('persists each posts sort in the query string and drops the created-date default', () => {
        expect(parsePostsListSort(null)).toBe('created');
        expect(parsePostsListSort('nope')).toBe('created');
        expect(parsePostsListFilters(new URLSearchParams('sort=popular')).sort).toBe('created');

        for (const option of POSTS_SORT_OPTIONS) {
            expect(parsePostsListSort(option.value)).toBe(option.value);
            expect(parsePostsListFilters(new URLSearchParams(`sort=${option.value}`)).sort).toBe(option.value);
        }

        expect(postsIndexPath({ sort: 'created' })).toBe('/posts');
        expect(postsIndexPath({ sort: 'created_oldest' })).toBe('/posts?sort=created_oldest');
        expect(postsIndexPath({ sort: 'updated' })).toBe('/posts?sort=updated');
        expect(postsIndexPath({ sort: 'updated_oldest' })).toBe('/posts?sort=updated_oldest');
        expect(postsIndexPath({ sort: 'published' })).toBe('/posts?sort=published');
        expect(postsIndexPath({ sort: 'published_oldest' })).toBe('/posts?sort=published_oldest');
        expect(postsIndexPath({ tab: 'draft', scope: 'all', sort: 'published', page: 2 })).toBe(
            '/posts?type=draft&scope=all&sort=published&page=2'
        );

        expect(postsIndexQueryParams({ tab: 'published', scope: 'user', page: 1, sort: 'created' })).toEqual({});
        expect(postsIndexQueryParams({ tab: 'published', scope: 'user', page: 1, sort: 'created_oldest' })).toEqual({
            sort: 'created_oldest',
        });
        expect(postsIndexQueryParams({ tab: 'draft', scope: 'user', page: 1, sort: 'updated' })).toEqual({
            type: 'draft',
            sort: 'updated',
        });
        expect(postsIndexQueryParams({ tab: 'published', scope: 'all', page: 4, sort: 'updated_oldest' })).toEqual({
            scope: 'all',
            sort: 'updated_oldest',
            page: 4,
        });
        expect(postsIndexQueryParams({ tab: 'published', scope: 'user', page: 1, sort: 'published' })).toEqual({
            sort: 'published',
        });
        expect(postsIndexQueryParams({ tab: 'published', scope: 'user', page: 1, sort: 'published_oldest' })).toEqual({
            sort: 'published_oldest',
        });
    });
});
