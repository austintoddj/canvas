import { describe, expect, it } from 'vitest';

import { isPostPublished, parsePostsListFilters, postsIndexPath, postsIndexQueryParams } from '@/lib/posts/list';
import postsIndexSource from '@/pages/Posts/Index.tsx?raw';
import mediaIndexSource from '@/pages/Media/Index.tsx?raw';

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
        expect(postsIndexPath({ tab: 'draft', scope: 'all', page: 2 })).toBe('/posts?type=draft&scope=all&page=2');
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

describe('posts list UX (shipped source)', () => {
    it('matches list chrome/skeleton/empty patterns and uses Alert for deletes', () => {
        expect(postsIndexSource).toContain('PageHeader');
        expect(postsIndexSource).toContain('title="Posts"');
        expect(postsIndexSource).toContain('TableListSkeleton');
        expect(postsIndexSource).toContain('ContentReveal');
        expect(postsIndexSource).toContain('EmptyStateReveal');
        expect(postsIndexSource).toContain('PostsEmptyVisual');
        expect(postsIndexSource).toContain('Alert');
        expect(postsIndexSource).not.toContain('window.confirm');
        expect(postsIndexSource).not.toContain('Loading posts…');
    });
});

describe('media page title (shipped source)', () => {
    it('uses Media Library as the page title', () => {
        expect(mediaIndexSource).toContain('title="Media Library"');
    });
});
