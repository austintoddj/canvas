import { ALLOWED_MEDIA_MIME_TYPES, type AllowedMediaMimeType } from '@/lib/api/media';
import { buildQueryString } from '@/lib/api/query';
import type { MediaIndexParams } from '@/types/api';

export type MediaListScope = 'user' | 'all';

export type MediaMimeFilter = '' | 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

export type MediaListFilters = {
    scope: MediaListScope;
    search: string;
    mime: MediaMimeFilter;
    page: number;
};

export const MEDIA_MIME_FILTERS: { value: MediaMimeFilter; label: string }[] = [
    { value: '', label: 'All types' },
    { value: 'image/jpeg', label: 'JPEG' },
    { value: 'image/png', label: 'PNG' },
    { value: 'image/gif', label: 'GIF' },
    { value: 'image/webp', label: 'WebP' },
];

const MIME_FILTER_VALUES = new Set<string>(MEDIA_MIME_FILTERS.map((filter) => filter.value));

export function parseMediaListFilters(searchParams: URLSearchParams): MediaListFilters {
    const scope = searchParams.get('scope') === 'all' ? 'all' : 'user';
    const search = searchParams.get('search')?.trim() ?? '';
    const mimeParam = searchParams.get('mime') ?? '';
    const mime = MIME_FILTER_VALUES.has(mimeParam) ? (mimeParam as MediaMimeFilter) : '';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);

    return { scope, search, mime, page };
}

export function mediaIndexPath(filters: Partial<MediaListFilters> = {}): string {
    return `/media${buildQueryString(mediaIndexQueryParams({
        scope: filters.scope ?? 'user',
        search: filters.search ?? '',
        mime: filters.mime ?? '',
        page: filters.page ?? 1,
    }))}`;
}

export function mediaIndexQueryParams(filters: MediaListFilters): MediaIndexParams {
    return {
        scope: filters.scope === 'all' ? 'all' : undefined,
        search: filters.search.trim() === '' ? undefined : filters.search.trim(),
        mime: filters.mime === '' ? undefined : filters.mime,
        page: filters.page > 1 ? filters.page : undefined,
    };
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
