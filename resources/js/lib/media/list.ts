import { ALLOWED_MEDIA_MIME_TYPES, type AllowedMediaMimeType } from '@/lib/api/media';
import { buildQueryString } from '@/lib/api/query';
import type { MediaIndexParams } from '@/types/api';

export type MediaListScope = 'user' | 'all';

export type MediaMimeFilter = '' | 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

export type MediaListSort = 'newest' | 'oldest';

export type MediaListFilters = {
    scope: MediaListScope;
    search: string;
    mime: MediaMimeFilter;
    sort: MediaListSort;
    page: number;
    tag?: string | null;
    untagged?: boolean;
};

export type MediaUrlFilterPatch = Partial<
    Pick<MediaListFilters, 'scope' | 'search' | 'mime' | 'sort' | 'tag' | 'untagged'>
>;

const MEDIA_TAG_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const MEDIA_MIME_FILTERS: { value: MediaMimeFilter; labelKey?: string; label?: string }[] = [
    { value: '', labelKey: 'media.all_types' },
    { value: 'image/jpeg', label: 'JPEG' },
    { value: 'image/png', label: 'PNG' },
    { value: 'image/gif', label: 'GIF' },
    { value: 'image/webp', label: 'WebP' },
];

export const MEDIA_SORT_OPTIONS: { value: MediaListSort; labelKey: string }[] = [
    { value: 'newest', labelKey: 'media.sort_newest' },
    { value: 'oldest', labelKey: 'media.sort_oldest' },
];

export const MEDIA_SEARCH_DEBOUNCE_MS = 300;

export const MEDIA_EMPTY_STATE_KEYS = {
    headline: 'media.empty_headline',
    blurb: 'media.empty_blurb',
    cta: 'media.empty_cta',
} as const;

/** @deprecated Prefer t('media.filtered_empty') at the call site. */
export const MEDIA_FILTERED_EMPTY_MESSAGE = 'No media matches your filters.';

const MIME_FILTER_VALUES = new Set<string>(MEDIA_MIME_FILTERS.map((filter) => filter.value));
const SORT_VALUES = new Set<string>(MEDIA_SORT_OPTIONS.map((option) => option.value));

export function parseMediaListFilters(searchParams: URLSearchParams): MediaListFilters {
    const scope = searchParams.get('scope') === 'all' ? 'all' : 'user';
    const search = searchParams.get('search')?.trim() ?? '';
    const mimeParam = searchParams.get('mime') ?? '';
    const mime = MIME_FILTER_VALUES.has(mimeParam) ? (mimeParam as MediaMimeFilter) : '';
    const sortParam = searchParams.get('sort') ?? '';
    const sort = SORT_VALUES.has(sortParam) ? (sortParam as MediaListSort) : 'newest';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const tagParam = searchParams.get('tag') ?? '';
    const tag = MEDIA_TAG_UUID.test(tagParam) ? tagParam : null;
    const untagged = tag === null && searchParams.get('untagged') === '1';

    return { scope, search, mime, sort, page, tag, untagged };
}

export function mediaIndexPath(filters: Partial<MediaListFilters> = {}): string {
    return `/media${buildQueryString(
        mediaIndexQueryParams({
            scope: filters.scope ?? 'user',
            search: filters.search ?? '',
            mime: filters.mime ?? '',
            sort: filters.sort ?? 'newest',
            page: filters.page ?? 1,
        })
    )}`;
}

export function mediaIndexQueryParams(filters: MediaListFilters): MediaIndexParams {
    const tag = filters.tag ?? null;
    const untagged = Boolean(filters.untagged) && tag === null;
    const params: MediaIndexParams = {};

    if (filters.scope === 'all') {
        params.scope = 'all';
    }

    if (filters.search.trim() !== '') {
        params.search = filters.search.trim();
    }

    if (filters.mime !== '') {
        params.mime = filters.mime;
    }

    if (filters.sort === 'oldest') {
        params.sort = 'oldest';
    }

    if (filters.page > 1) {
        params.page = filters.page;
    }

    if (tag) {
        params.tag = tag;
    } else if (untagged) {
        params.untagged = 1;
    }

    return params;
}

export function mediaListHasActiveFilters(
    filters: Pick<MediaListFilters, 'search' | 'mime'> & { tag?: string | null; untagged?: boolean }
): boolean {
    return filters.search.trim() !== '' || filters.mime !== '' || Boolean(filters.tag) || Boolean(filters.untagged);
}

export function updateMediaListSearchParams(current: URLSearchParams, patch: MediaUrlFilterPatch): URLSearchParams {
    const next = new URLSearchParams(current);
    const currentFilters = parseMediaListFilters(current);

    const scope = patch.scope ?? currentFilters.scope;
    const search = patch.search !== undefined ? patch.search : currentFilters.search;
    const mime = patch.mime !== undefined ? patch.mime : currentFilters.mime;
    const sort = patch.sort ?? currentFilters.sort;

    if (scope === 'all') {
        next.set('scope', 'all');
    } else {
        next.delete('scope');
    }

    if (search.trim() !== '') {
        next.set('search', search.trim());
    } else {
        next.delete('search');
    }

    if (mime !== '') {
        next.set('mime', mime);
    } else {
        next.delete('mime');
    }

    if (sort === 'oldest') {
        next.set('sort', 'oldest');
    } else {
        next.delete('sort');
    }

    if (patch.tag !== undefined) {
        if (patch.tag) {
            next.set('tag', patch.tag);
            next.delete('untagged');
        } else {
            next.delete('tag');
            if (patch.untagged !== true) {
                next.delete('untagged');
            }
        }
    }

    if (patch.untagged !== undefined) {
        if (patch.untagged) {
            next.set('untagged', '1');
            next.delete('tag');
        } else {
            next.delete('untagged');
        }
    }

    next.delete('page');

    return next;
}

export function nextCommittedMediaSearch(draft: string, committed: string): string | null {
    const next = draft.trim();
    const current = committed.trim();

    if (next === current) {
        return null;
    }

    return next;
}

export function mediaDisplayName(media: {
    original_name: string | null;
    filename: string;
    alt?: string | null;
}): string {
    const original = media.original_name?.trim();

    if (original) {
        return original;
    }

    const alt = media.alt?.trim();

    if (alt) {
        return alt;
    }

    return media.filename;
}

export function formatMediaBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMediaDimensions(width: number | null, height: number | null): string {
    if (width === null || height === null || width <= 0 || height <= 0) {
        return '—';
    }

    return `${width} × ${height}`;
}

export function formatMediaDate(value: string | null): string {
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

export function mediaMimeLabel(mimeType: string): string {
    const match = MEDIA_MIME_FILTERS.find((filter) => filter.value !== '' && mimeType.startsWith(filter.value));

    if (match?.label) {
        return match.label;
    }

    if (mimeType.startsWith('image/')) {
        return mimeType.slice('image/'.length).toUpperCase();
    }

    return mimeType;
}

export function isAllowedMediaFile(file: File): boolean {
    return ALLOWED_MEDIA_MIME_TYPES.includes(file.type as AllowedMediaMimeType);
}

export function mediaFilesFromList(fileList: FileList | File[] | null | undefined): File[] {
    if (fileList == null) {
        return [];
    }

    return Array.from(fileList).filter(isAllowedMediaFile);
}
