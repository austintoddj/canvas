import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import type {
    Paginated,
    PostListItem,
    Topic,
    TopicCreateResponse,
    TopicPostsParams,
    TopicsIndexParams,
    TopicStorePayload,
} from '@/types/api';

export const topicsApi = {
    index(params: TopicsIndexParams = {}, signal?: AbortSignal) {
        return api.get<Paginated<Topic>>(`/topics${buildQueryString(params)}`, signal);
    },

    create(signal?: AbortSignal) {
        return api.get<TopicCreateResponse>('/topics/create', signal);
    },

    show(id: string, signal?: AbortSignal) {
        return api.get<Topic>(`/topics/${id}`, signal);
    },

    posts(id: string, params: TopicPostsParams = {}, signal?: AbortSignal) {
        return api.get<Paginated<PostListItem>>(`/topics/${id}/posts${buildQueryString(params)}`, signal);
    },

    store(id: string, payload: TopicStorePayload, signal?: AbortSignal) {
        return api.post<Topic>(`/topics/${id}`, payload, signal);
    },

    destroy(id: string, signal?: AbortSignal) {
        return api.delete<null>(`/topics/${id}`, signal);
    },
};
