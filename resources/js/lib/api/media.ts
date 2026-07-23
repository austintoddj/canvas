import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import type {
    Media,
    MediaCreateResponse,
    MediaIndexParams,
    MediaStoreOptions,
    MediaUpdatePayload,
    Paginated,
} from '@/types/api';

/** Matches `StoreMediaRequest` mimes: jpg, jpeg, gif, png, webp. */
export const ALLOWED_MEDIA_MIME_TYPES = ['image/jpeg', 'image/gif', 'image/png', 'image/webp'] as const;

export type AllowedMediaMimeType = (typeof ALLOWED_MEDIA_MIME_TYPES)[number];

export class MediaUploadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MediaUploadError';
    }
}

export function getMaxUploadBytes(): number {
    return window.Canvas?.maxUpload ?? 3_145_728;
}

export function validateMediaFile(file: File, maxBytes: number = getMaxUploadBytes()): void {
    if (!ALLOWED_MEDIA_MIME_TYPES.includes(file.type as AllowedMediaMimeType)) {
        throw new MediaUploadError('File type not supported. Use JPG, GIF, PNG, or WebP.');
    }

    if (file.size > maxBytes) {
        throw new MediaUploadError(`File is too large. Maximum size is ${formatBytes(maxBytes)}.`);
    }
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadMedia(file: File, options: MediaStoreOptions = {}, signal?: AbortSignal): Promise<Media> {
    validateMediaFile(file);

    const { id } = await mediaApi.create(signal);

    return mediaApi.store(id, file, options, signal);
}

export const mediaApi = {
    index(params: MediaIndexParams = {}, signal?: AbortSignal) {
        return api.get<Paginated<Media>>(`/media${buildQueryString(params)}`, signal);
    },

    create(signal?: AbortSignal) {
        return api.get<MediaCreateResponse>('/media/create', signal);
    },

    show(id: string, signal?: AbortSignal) {
        return api.get<Media>(`/media/${id}`, signal);
    },

    store(id: string, file: File, options: MediaStoreOptions = {}, signal?: AbortSignal) {
        const formData = new FormData();
        formData.append('file', file);

        if (options.alt != null) {
            formData.append('alt', options.alt);
        }

        if (options.caption != null) {
            formData.append('caption', options.caption);
        }

        if (options.original_name != null) {
            formData.append('original_name', options.original_name);
        }

        return api.postForm<Media>(`/media/${id}`, formData, signal);
    },

    update(id: string, payload: MediaUpdatePayload, signal?: AbortSignal) {
        return api.put<Media>(`/media/${id}`, payload, signal);
    },

    destroy(id: string, signal?: AbortSignal) {
        return api.delete<null>(`/media/${id}`, signal);
    },
};
