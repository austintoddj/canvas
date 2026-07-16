import { buildQueryString } from '@/lib/api/query';
import { parsePublishedAt, type PostPublishStatus } from '@/lib/posts/form';
import type { PostsIndexParams } from '@/types/api';

export type PostsListTab = 'published' | 'draft';

export type PostsListFilters = {
    tab: PostsListTab;
    scope: 'user' | 'all';
    page: number;
};

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

    return `/posts${buildQueryString(params)}`;
}

export function parsePostsListFilters(searchParams: URLSearchParams): PostsListFilters {
    const tab = searchParams.get('type') === 'draft' ? 'draft' : 'published';
    const scope = searchParams.get('scope') === 'all' ? 'all' : 'user';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);

    return { tab, scope, page };
}

export function postsIndexQueryParams(filters: PostsListFilters): PostsIndexParams {
    return {
        type: filters.tab === 'draft' ? 'draft' : undefined,
        scope: filters.scope === 'all' ? 'all' : undefined,
        page: filters.page > 1 ? filters.page : undefined,
    };
}

export { formatListDate as formatPostDate } from '@/lib/format-list-date';
