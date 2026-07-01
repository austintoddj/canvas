import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import type {
    Paginated,
    PostListItem,
    Tag,
    TagCreateResponse,
    TagPostsParams,
    TagsIndexParams,
    TagStorePayload,
} from '@/types/api';

export const tagsApi = {
    index(params: TagsIndexParams = {}, signal?: AbortSignal) {
        return api.get<Paginated<Tag>>(`/tags${buildQueryString(params)}`, signal);
    },

    create(signal?: AbortSignal) {
        return api.get<TagCreateResponse>('/tags/create', signal);
    },

    show(id: string, signal?: AbortSignal) {
        return api.get<Tag>(`/tags/${id}`, signal);
    },

    posts(id: string, params: TagPostsParams = {}, signal?: AbortSignal) {
        return api.get<Paginated<PostListItem>>(`/tags/${id}/posts${buildQueryString(params)}`, signal);
    },

    store(id: string, payload: TagStorePayload, signal?: AbortSignal) {
        return api.post<Tag>(`/tags/${id}`, payload, signal);
    },

    destroy(id: string, signal?: AbortSignal) {
        return api.delete<null>(`/tags/${id}`, signal);
    },
};
