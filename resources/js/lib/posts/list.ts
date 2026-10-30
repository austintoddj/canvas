import { buildQueryString } from '@/lib/api/query';
import { parsePublishedAt, type PostPublishStatus } from '@/lib/posts/form';
import type { PostListItem, PostsIndexParams } from '@/types/api';

export type PostsListTab = 'published' | 'draft';

/** `created` is newest-first and omitted from the query string. */
export type PostsListSort =
    'created' | 'created_oldest' | 'updated' | 'updated_oldest' | 'published' | 'published_oldest';

export type PostsListFilters = {
    tab: PostsListTab;
    scope: 'user' | 'all';
    page: number;
    sort: PostsListSort;
};

export const POSTS_SORT_OPTIONS: { value: PostsListSort; labelKey: string }[] = [
    { value: 'created', labelKey: 'posts.sort_created_newest' },
    { value: 'created_oldest', labelKey: 'posts.sort_created_oldest' },
    { value: 'updated', labelKey: 'posts.sort_updated_newest' },
    { value: 'updated_oldest', labelKey: 'posts.sort_updated_oldest' },
    { value: 'published', labelKey: 'posts.sort_published_newest' },
    { value: 'published_oldest', labelKey: 'posts.sort_published_oldest' },
];

const POSTS_SORT_VALUES = new Set<string>(POSTS_SORT_OPTIONS.map((option) => option.value));

export function parsePostsListSort(value: string | null | undefined): PostsListSort {
    if (value !== null && value !== undefined && POSTS_SORT_VALUES.has(value)) {
        return value as PostsListSort;
    }

    return 'created';
}

export function postListStatus(publishedAt: string | null | undefined, now: Date = new Date()): PostPublishStatus {
    if (publishedAt === null || publishedAt === undefined || publishedAt === '') {
        return 'draft';
    }

    const published = parsePublishedAt(publishedAt);

    if (published === null) {
        return 'draft';
    }

    return published <= now ? 'published' : 'scheduled';
}

export function isPostPublished(publishedAt: string | null, now: Date = new Date()): boolean {
    return postListStatus(publishedAt, now) === 'published';
}

export function isPostScheduled(publishedAt: string | null, now: Date = new Date()): boolean {
    return postListStatus(publishedAt, now) === 'scheduled';
}

/** Row timestamp follows the active sort. Drafts have no published date. */
export function postListSortInstant(
    post: Pick<PostListItem, 'created_at' | 'updated_at' | 'published_at'>,
    sort: PostsListSort
): string | null {
    if (sort === 'published' || sort === 'published_oldest') {
        return post.published_at;
    }

    if (sort === 'updated' || sort === 'updated_oldest') {
        return post.updated_at;
    }

    return post.created_at;
}

export function postsIndexPath(filters: Partial<PostsListFilters> = {}): string {
    const params: PostsIndexParams = {};

    if (filters.tab === 'draft') {
        params.type = 'draft';
    }

    if (filters.scope === 'all') {
        params.scope = 'all';
    }

    if (filters.sort !== undefined && filters.sort !== 'created') {
        params.sort = filters.sort;
    }

    if (filters.page !== undefined && filters.page > 1) {
        params.page = filters.page;
    }

    return `/posts${buildQueryString(params)}`;
}

export function parsePostsListFilters(searchParams: URLSearchParams): PostsListFilters {
    const tab = searchParams.get('type') === 'draft' ? 'draft' : 'published';
    const scope = searchParams.get('scope') === 'all' ? 'all' : 'user';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const sort = parsePostsListSort(searchParams.get('sort'));

    return { tab, scope, page, sort };
}

export function postsIndexQueryParams(filters: PostsListFilters): PostsIndexParams {
    return {
        type: filters.tab === 'draft' ? 'draft' : undefined,
        scope: filters.scope === 'all' ? 'all' : undefined,
        sort: filters.sort === 'created' ? undefined : filters.sort,
        page: filters.page > 1 ? filters.page : undefined,
    };
}

/** Counts match the index API: drafts include scheduled posts. */
export function countsAfterPostDelete(
    counts: { draftCount: number; publishedCount: number },
    status: PostPublishStatus
): { draftCount: number; publishedCount: number } {
    if (status === 'published') {
        return {
            draftCount: counts.draftCount,
            publishedCount: Math.max(0, counts.publishedCount - 1),
        };
    }

    return {
        draftCount: Math.max(0, counts.draftCount - 1),
        publishedCount: counts.publishedCount,
    };
}

export { formatListDate as formatPostDate } from '@/lib/format-list-date';
