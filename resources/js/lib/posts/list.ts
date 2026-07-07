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

export function formatPostDate(value: string | null): string {
    if (value === null || value === '') {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}