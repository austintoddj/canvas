import { api, ValidationError } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import type {
    MediaTag,
    MediaTagAttachPayload,
    MediaTagAttachResult,
    MediaTagCreateResponse,
    MediaTagDetachResult,
    MediaTagIndexParams,
    MediaTagIndexResponse,
    MediaTagStorePayload,
} from '@/types/api';

export function collidingMediaTag(error: unknown): { id: string; name: string } | null {
    if (!(error instanceof ValidationError)) {
        return null;
    }

    if (typeof error.body !== 'object' || error.body === null || !('tag' in error.body)) {
        return null;
    }

    const tag = (error.body as { tag: unknown }).tag;

    if (typeof tag !== 'object' || tag === null) {
        return null;
    }

    const id = 'id' in tag ? String((tag as { id: unknown }).id) : '';
    const name = 'name' in tag ? String((tag as { name: unknown }).name) : '';

    if (id === '') {
        return null;
    }

    return { id, name };
}

export function mediaTagNameTaken(
    name: string,
    tags: readonly { id: string; name: string }[],
    ignoreId?: string
): boolean {
    const needle = name.trim().toLowerCase();

    if (needle === '') {
        return false;
    }

    return tags.some((tag) => tag.id !== ignoreId && tag.name.trim().toLowerCase() === needle);
}

export function isMediaTagNameConflict(error: unknown): boolean {
    if (collidingMediaTag(error) !== null) {
        return true;
    }

    if (!(error instanceof ValidationError)) {
        return false;
    }

    return (error.errors.name ?? []).some((message) => message.trim() !== '');
}

export async function createMediaTag(name: string, signal?: AbortSignal): Promise<MediaTag> {
    const trimmed = name.trim();
    const created = await mediaTagsApi.create(signal);

    return mediaTagsApi.store(created.id, { name: trimmed }, signal);
}

export async function createOrReuseMediaTag(name: string, signal?: AbortSignal): Promise<MediaTag> {
    const trimmed = name.trim();

    try {
        const created = await mediaTagsApi.create(signal);

        return await mediaTagsApi.store(created.id, { name: trimmed }, signal);
    } catch (error) {
        const colliding = collidingMediaTag(error);

        if (colliding !== null) {
            return colliding;
        }

        throw error;
    }
}

export const mediaTagsApi = {
    index(params: MediaTagIndexParams = {}, signal?: AbortSignal) {
        return api.get<MediaTagIndexResponse>(`/media-tags${buildQueryString(params)}`, signal);
    },

    create(signal?: AbortSignal) {
        return api.get<MediaTagCreateResponse>('/media-tags/create', signal);
    },

    store(id: string, payload: MediaTagStorePayload, signal?: AbortSignal) {
        return api.post<MediaTag>(`/media-tags/${id}`, payload, signal);
    },

    destroy(id: string, signal?: AbortSignal) {
        return api.delete<null>(`/media-tags/${id}`, signal);
    },

    attach(id: string, payload: MediaTagAttachPayload, params: MediaTagIndexParams = {}, signal?: AbortSignal) {
        return api.post<MediaTagAttachResult>(`/media-tags/${id}/attach${buildQueryString(params)}`, payload, signal);
    },

    detach(id: string, payload: MediaTagAttachPayload, params: MediaTagIndexParams = {}, signal?: AbortSignal) {
        return api.post<MediaTagDetachResult>(`/media-tags/${id}/detach${buildQueryString(params)}`, payload, signal);
    },
};
