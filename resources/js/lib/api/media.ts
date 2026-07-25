import { ApiError, ValidationError, api, apiErrorMessage } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import { t } from '@/lib/i18n';
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

export function unsupportedTypeMessage(): string {
    return t('media.unsupported_type', 'File type not supported. Use JPG, GIF, PNG, or WebP.');
}

export function tooLargeMessage(maxBytes: number = getMaxUploadBytes()): string {
    return t(
        'media.too_large',
        { max: formatBytes(maxBytes) },
        `File is too large. Maximum size is ${formatBytes(maxBytes)}.`
    );
}

export function tooLargeMessageGeneric(): string {
    return t('media.too_large_generic', 'File is too large. Try a smaller image.');
}

export function validateMediaFile(file: File, maxBytes: number = getMaxUploadBytes()): void {
    if (!ALLOWED_MEDIA_MIME_TYPES.includes(file.type as AllowedMediaMimeType)) {
        throw new MediaUploadError(unsupportedTypeMessage());
    }

    if (file.size > maxBytes) {
        throw new MediaUploadError(tooLargeMessage(maxBytes));
    }
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }

    const mb = bytes / (1024 * 1024);
    const fixed = mb.toFixed(1);

    return `${fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed} MB`;
}

function rethrowUploadFailure(error: unknown): never {
    if (error instanceof MediaUploadError) {
        throw error;
    }

    if (error instanceof ValidationError) {
        const fileMessage = error.errors.file?.[0];
        // Prefer client-localized size copy when the server rejects on size.
        if (fileMessage && /too large|max|size/i.test(fileMessage)) {
            throw new MediaUploadError(tooLargeMessage());
        }

        throw new MediaUploadError(fileMessage ?? apiErrorMessage(error, t('media.upload_failed', 'Upload failed.')));
    }

    if (error instanceof ApiError && error.status === 413) {
        // Always localize 413 in the SPA; PHP may not know the user locale yet.
        throw new MediaUploadError(tooLargeMessage());
    }

    if (error instanceof Error) {
        throw error;
    }

    throw new MediaUploadError(apiErrorMessage(error, t('media.upload_failed', 'Upload failed.')));
}

export async function uploadMedia(file: File, options: MediaStoreOptions = {}, signal?: AbortSignal): Promise<Media> {
    validateMediaFile(file);

    try {
        const { id } = await mediaApi.create(signal);

        return await mediaApi.store(id, file, options, signal);
    } catch (error) {
        rethrowUploadFailure(error);
    }
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
