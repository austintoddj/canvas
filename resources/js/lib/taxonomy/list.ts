import { pageQueryParam, parsePageParam } from '@/lib/list-pagination';
import type { TagsIndexParams, TopicsIndexParams } from '@/types/api';

export type OrganizeTab = 'topics' | 'tags';

export type TaxonomyListSort = 'newest' | 'posts' | 'name';

export type TaxonomyListFilters = {
    page: number;
    search: string;
    sort: TaxonomyListSort;
};

export type OrganizeListFilters = TaxonomyListFilters & {
    tab: OrganizeTab;
};

export const TAXONOMY_SEARCH_DEBOUNCE_MS = 300;

export const TAXONOMY_SORT_OPTIONS: { value: TaxonomyListSort; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'posts', label: 'Most posts' },
    { value: 'name', label: 'Name' },
];

const SORT_VALUES = new Set<string>(TAXONOMY_SORT_OPTIONS.map((option) => option.value));

export function parseOrganizeTab(searchParams: URLSearchParams): OrganizeTab {
    return searchParams.get('tab') === 'tags' ? 'tags' : 'topics';
}

export function parseTaxonomySort(value: string | null | undefined): TaxonomyListSort {
    if (value !== null && value !== undefined && SORT_VALUES.has(value)) {
        return value as TaxonomyListSort;
    }

    return 'newest';
}

export function parseTaxonomyListFilters(searchParams: URLSearchParams): TaxonomyListFilters {
    return {
        page: parsePageParam(searchParams),
        search: searchParams.get('search')?.trim() ?? '',
        sort: parseTaxonomySort(searchParams.get('sort')),
    };
}

export function parseOrganizeListFilters(searchParams: URLSearchParams): OrganizeListFilters {
    return {
        tab: parseOrganizeTab(searchParams),
        ...parseTaxonomyListFilters(searchParams),
    };
}

export function taxonomyListHasActiveFilters(filters: Pick<TaxonomyListFilters, 'search'>): boolean {
    return filters.search.trim() !== '';
}

export function taxonomyDetailId(searchParams: URLSearchParams): string | null {
    const detail = searchParams.get('detail');

    if (detail === null || detail.trim() === '') {
        return null;
    }

    return detail;
}

export function setTaxonomyDetailParam(current: URLSearchParams, itemId: string | null): URLSearchParams {
    const next = new URLSearchParams(current);

    if (itemId === null || itemId === '') {
        next.delete('detail');
    } else {
        next.set('detail', itemId);
    }

    return next;
}

export function setOrganizeTabParam(current: URLSearchParams, tab: OrganizeTab): URLSearchParams {
    const next = new URLSearchParams(current);

    if (tab === 'topics') {
        next.delete('tab');
    } else {
        next.set('tab', 'tags');
    }

    next.delete('page');
    next.delete('detail');
    next.delete('search');
    next.delete('sort');

    return next;
}

export function organizeIndexPath(filters: Partial<OrganizeListFilters> & { detail?: string | null } = {}): string {
    const tab = filters.tab ?? 'topics';
    const page = filters.page ?? 1;
    const search = filters.search?.trim() ?? '';
    const sort = filters.sort ?? 'newest';
    const params = new URLSearchParams();

    if (tab === 'tags') {
        params.set('tab', 'tags');
    }

    if (search !== '') {
        params.set('search', search);
    }

    if (sort !== 'newest') {
        params.set('sort', sort);
    }

    if (page > 1) {
        params.set('page', String(page));
    }

    if (filters.detail !== undefined && filters.detail !== null && filters.detail !== '') {
        params.set('detail', filters.detail);
    }

    const query = params.toString();

    return query === '' ? '/organize' : `/organize?${query}`;
}

export function tagsDetailPath(itemId: string): string {
    return organizeIndexPath({ tab: 'tags', detail: itemId });
}

export function topicsDetailPath(itemId: string): string {
    return organizeIndexPath({ tab: 'topics', detail: itemId });
}

export function tagsIndexPath(filters: Partial<TaxonomyListFilters> = {}): string {
    return organizeIndexPath({ tab: 'tags', ...filters });
}

export function topicsIndexPath(filters: Partial<TaxonomyListFilters> = {}): string {
    return organizeIndexPath({ tab: 'topics', ...filters });
}

export function taxonomyIndexQueryParams(filters: TaxonomyListFilters): TagsIndexParams {
    return {
        page: pageQueryParam(filters.page),
        search: filters.search.trim() === '' ? undefined : filters.search.trim(),
        sort: filters.sort === 'newest' ? undefined : filters.sort,
    };
}

export { formatListDate as formatTaxonomyDate } from '@/lib/format-list-date';

export type { TagsIndexParams, TopicsIndexParams };
