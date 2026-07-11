import { buildQueryString } from '@/lib/api/query';
import { pageQueryParam, parsePageParam } from '@/lib/list-pagination';
import type { Paginated, PaginatedLink, UsersIndexParams } from '@/types/api';

export type UsersListFilters = {
    page: number;
};

/** Laravel ResourceCollection pagination (meta/links) or flat LengthAwarePaginator JSON. */
export type ResourceCollectionPage<T> = {
    data: T[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number | null;
    to?: number | null;
    first_page_url?: string;
    last_page_url?: string;
    next_page_url?: string | null;
    prev_page_url?: string | null;
    path?: string;
    links?:
        PaginatedLink[] | { first?: string | null; last?: string | null; prev?: string | null; next?: string | null };
    meta?: {
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
        from?: number | null;
        to?: number | null;
        path?: string;
        first_page_url?: string;
        last_page_url?: string;
        next_page_url?: string | null;
        prev_page_url?: string | null;
        links?: PaginatedLink[];
    };
};

export function parseUsersListFilters(searchParams: URLSearchParams): UsersListFilters {
    return {
        page: parsePageParam(searchParams),
    };
}

export function usersIndexPath(filters: Partial<UsersListFilters> = {}): string {
    const page = filters.page ?? 1;
    const params: UsersIndexParams = {};

    if (page > 1) {
        params.page = page;
    }

    return `/settings/users${buildQueryString(params)}`;
}

export function usersIndexQueryParams(filters: UsersListFilters): UsersIndexParams {
    return {
        page: pageQueryParam(filters.page),
    };
}

export function normalizeResourceCollectionPage<T>(body: ResourceCollectionPage<T>): Paginated<T> {
    const meta = body.meta;
    const currentPage = meta?.current_page ?? body.current_page ?? 1;
    const lastPage = meta?.last_page ?? body.last_page ?? 1;
    const perPage = meta?.per_page ?? body.per_page ?? body.data.length;
    const total = meta?.total ?? body.total ?? body.data.length;
    const from = meta?.from ?? body.from ?? (body.data.length > 0 ? 1 : null);
    const to = meta?.to ?? body.to ?? (body.data.length > 0 ? body.data.length : null);
    const path = meta?.path ?? body.path ?? '';

    const topLinks = body.links;
    const linkBag =
        topLinks !== undefined && !Array.isArray(topLinks)
            ? topLinks
            : {
                  first: body.first_page_url,
                  last: body.last_page_url,
                  prev: body.prev_page_url,
                  next: body.next_page_url,
              };

    const pageLinks: PaginatedLink[] = Array.isArray(topLinks)
        ? topLinks
        : Array.isArray(meta?.links)
          ? meta.links
          : [];

    return {
        data: body.data,
        current_page: currentPage,
        last_page: lastPage,
        per_page: perPage,
        total,
        from,
        to,
        first_page_url: linkBag.first ?? meta?.first_page_url ?? body.first_page_url ?? '',
        last_page_url: linkBag.last ?? meta?.last_page_url ?? body.last_page_url ?? '',
        next_page_url: linkBag.next ?? meta?.next_page_url ?? body.next_page_url ?? null,
        prev_page_url: linkBag.prev ?? meta?.prev_page_url ?? body.prev_page_url ?? null,
        path,
        links: pageLinks,
    };
}
