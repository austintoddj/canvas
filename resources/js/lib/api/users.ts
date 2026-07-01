import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import type {
    Paginated,
    PostListItem,
    UserCreateResponse,
    UserPostsParams,
    UserStorePayload,
    UserStoreResponse,
    UsersIndexParams,
} from '@/types/api';
import type { UserResource } from '@/types/boot';

export const usersApi = {
    index(params: UsersIndexParams = {}, signal?: AbortSignal) {
        return api.get<Paginated<UserResource>>(`/users${buildQueryString(params)}`, signal);
    },

    create(signal?: AbortSignal) {
        return api.get<UserCreateResponse>('/users/create', signal);
    },

    show(id: string, signal?: AbortSignal) {
        return api.get<UserResource>(`/users/${id}`, signal);
    },

    posts(id: string, params: UserPostsParams = {}, signal?: AbortSignal) {
        return api.get<Paginated<PostListItem>>(`/users/${id}/posts${buildQueryString(params)}`, signal);
    },

    store(id: string, payload: UserStorePayload, signal?: AbortSignal) {
        return api.post<UserStoreResponse>(`/users/${id}`, payload, signal);
    },

    destroy(id: string, signal?: AbortSignal) {
        return api.delete<null>(`/users/${id}`, signal);
    },
};
