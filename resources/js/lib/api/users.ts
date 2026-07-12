import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import { normalizeResourceCollectionPage, type ResourceCollectionPage } from '@/lib/users/list';
import type {
    Paginated,
    PostListItem,
    UserCreateResponse,
    UserLookupParams,
    UserLookupResult,
    UserPostsParams,
    UserStorePayload,
    UserStoreResponse,
    UsersIndexParams,
} from '@/types/api';
import type { UserResource } from '@/types/boot';

export const usersApi = {
    async index(params: UsersIndexParams = {}, signal?: AbortSignal): Promise<Paginated<UserResource>> {
        const body = await api.get<ResourceCollectionPage<UserResource>>(`/users${buildQueryString(params)}`, signal);

        return normalizeResourceCollectionPage(body);
    },

    create(signal?: AbortSignal) {
        return api.get<UserCreateResponse>('/users/create', signal);
    },

    lookup(params: UserLookupParams, signal?: AbortSignal) {
        return api.get<UserLookupResult>(`/users/lookup${buildQueryString(params)}`, signal);
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
