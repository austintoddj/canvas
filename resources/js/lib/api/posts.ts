import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import type {
    Post,
    PostCreateResponse,
    PostShowResponse,
    PostStatsResponse,
    PostsIndexParams,
    PostsIndexResponse,
    PostStorePayload,
} from '@/types/api';

export const postsApi = {
    index(params: PostsIndexParams = {}, signal?: AbortSignal) {
        return api.get<PostsIndexResponse>(`/posts${buildQueryString(params)}`, signal);
    },

    create(signal?: AbortSignal) {
        return api.get<PostCreateResponse>('/posts/create', signal);
    },

    show(id: string, signal?: AbortSignal) {
        return api.get<PostShowResponse>(`/posts/${id}`, signal);
    },

    stats(id: string, signal?: AbortSignal) {
        return api.get<PostStatsResponse>(`/posts/${id}/stats`, signal);
    },

    store(id: string, payload: PostStorePayload, signal?: AbortSignal) {
        return api.post<Post>(`/posts/${id}`, payload, signal);
    },

    discard(id: string, signal?: AbortSignal) {
        return api.post<Post>(`/posts/${id}/discard`, {}, signal);
    },

    destroy(id: string, signal?: AbortSignal) {
        return api.delete<null>(`/posts/${id}`, signal);
    },
};
