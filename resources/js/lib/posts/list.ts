import { buildQueryString } from '@/lib/api/query';
import { parsePublishedAt, type PostPublishStatus } from '@/lib/posts/form';
import type { PostsIndexParams } from '@/types/api';

export type PostsListTab = 'published' | 'draft';

/** `created` is the historical default (newest `created_at`) and is omitted from the URL. */
export type PostsListSort = 'activity' | 'activity_asc' | 'published' | 'published_asc' | 'created' | 'created_asc';

export type PostsListFilters = {
    tab: PostsListTab;
    scope: 'user' | 'all';
    page: number;
    search: string;
    sort: PostsListSort;
};

export const POSTS_SORT_OPTIONS: { value: PostsListSort; labelKey: string }[] = [
    { value: 'activity', labelKey: 'posts.sort_activity_newest' },
    { value: 'activity_asc', labelKey: 'posts.sort_activity_oldest' },
    { value: 'published', labelKey: 'posts.sort_published_newest' },
    { value: 'published_asc', labelKey: 'posts.sort_published_oldest' },
    { value: 'created', labelKey: 'posts.sort_created_newest' },
    { value: 'created_asc', labelKey: 'posts.sort_created_oldest' },
];

const POSTS_SORT_VALUES = new Set<string>(POSTS_SORT_OPTIONS.map((option) => option.value));

export function parsePostsListSort(value: string | null | undefined): PostsListSort {
    if (value !== null && value !== undefined && POSTS_SORT_VALUES.has(value)) {
        return value as PostsListSort;
    }

    return 'created';
}

export const POSTS_SEARCH_DEBOUNCE_MS = 300;

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

export function postsIndexPath(filters: Partial<PostsListFilters> = {}): string {
    const params: PostsIndexParams = {};

    if (filters.tab === 'draft') {
        params.type = 'draft';
    }

    if (filters.scope === 'all') {
        params.scope = 'all';
    }

    if (filters.page !== undefined && filters.page > 1) {
        params.page = filters.page;
    }

    if (filters.search !== undefined && filters.search.trim() !== '') {
        params.search = filters.search.trim();
    }

    if (filters.sort !== undefined && filters.sort !== 'created') {
        params.sort = filters.sort;
    }

    return `/posts${buildQueryString(params)}`;
}

/** Editor routes only. Stats keeps the standard page well. */
export function isPostEditorPath(pathname: string): boolean {
    return /^\/posts\/[^/]+$/.test(pathname);
}

export function parsePostsListFilters(searchParams: URLSearchParams): PostsListFilters {
    const tab = searchParams.get('type') === 'draft' ? 'draft' : 'published';
    const scope = searchParams.get('scope') === 'all' ? 'all' : 'user';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const search = searchParams.get('search')?.trim() ?? '';
    const sort = parsePostsListSort(searchParams.get('sort'));

    return { tab, scope, page, search, sort };
}

export function postsIndexQueryParams(filters: PostsListFilters): PostsIndexParams {
    return {
        type: filters.tab === 'draft' ? 'draft' : undefined,
        scope: filters.scope === 'all' ? 'all' : undefined,
        page: filters.page > 1 ? filters.page : undefined,
        search: filters.search.trim() !== '' ? filters.search.trim() : undefined,
        sort: filters.sort === 'created' ? undefined : filters.sort,
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
