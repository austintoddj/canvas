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
};

export const MEDIA_MIME_FILTERS: { value: MediaMimeFilter; label: string }[] = [
    { value: '', label: 'All types' },
    { value: 'image/jpeg', label: 'JPEG' },
    { value: 'image/png', label: 'PNG' },
    { value: 'image/gif', label: 'GIF' },
    { value: 'image/webp', label: 'WebP' },
];

export const MEDIA_SORT_OPTIONS: { value: MediaListSort; label: string }[] = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
];

export const MEDIA_SEARCH_DEBOUNCE_MS = 300;

export const MEDIA_EMPTY_STATE = {
    headline: 'Start using Media',
    blurb: 'Upload images once, then drop them into posts as featured art or inline figures. Keep alt text and captions in one place so your library stays useful as it grows.',
    cta: 'Upload images',
} as const;

export const MEDIA_FILTERED_EMPTY_MESSAGE = 'No images match your filters.';

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

    return { scope, search, mime, sort, page };
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
    return {
        scope: filters.scope === 'all' ? 'all' : undefined,
        search: filters.search.trim() === '' ? undefined : filters.search.trim(),
        mime: filters.mime === '' ? undefined : filters.mime,
        sort: filters.sort === 'oldest' ? 'oldest' : undefined,
        page: filters.page > 1 ? filters.page : undefined,
    };
}

export function mediaListHasActiveFilters(filters: Pick<MediaListFilters, 'search' | 'mime'>): boolean {
    return filters.search.trim() !== '' || filters.mime !== '';
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

    if (match) {
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

/**
 * Prefer same-origin URLs for public-disk storage paths so images load when
 * APP_URL host/scheme differs from the browser origin (common local misconfig).
 */
export function resolveMediaUrl(url: string | null | undefined): string {
    if (url === null || url === undefined || url.trim() === '') {
        return '';
    }

    if (typeof window === 'undefined') {
        return url;
    }

    try {
        const parsed = new URL(url, window.location.origin);

        if (parsed.pathname.startsWith('/storage/')) {
            return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }

        return parsed.toString();
    } catch {
        return url;
    }
}
