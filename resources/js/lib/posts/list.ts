import { buildQueryString } from '@/lib/api/query';
import type { PostsIndexParams } from '@/types/api';

export type PostsListTab = 'published' | 'draft';

export type PostsListFilters = {
    tab: PostsListTab;
    scope: 'user' | 'all';
    page: number;
};

export function isPostPublished(publishedAt: string | null): boolean {
    if (publishedAt === null || publishedAt === '') {
        return false;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(publishedAt.trim());

    if (match !== null) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const published = new Date(year, month - 1, day);

        if (published.getFullYear() === year && published.getMonth() === month - 1 && published.getDate() === day) {
            return published <= new Date();
        }
    }

    const published = new Date(publishedAt);

    if (Number.isNaN(published.getTime())) {
        return false;
    }

    return published <= new Date();
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
