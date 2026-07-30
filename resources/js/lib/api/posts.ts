import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import type {
    CreatePostRevisionPayload,
    Post,
    PostCreateResponse,
    PostRevisionListResponse,
    PostRevisionResponse,
    PostRevisionsResponse,
    PostShowResponse,
    PostStatsResponse,
    PostsIndexParams,
    PostsIndexResponse,
    PostStorePayload,
    RenamePostRevisionPayload,
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

    revisions(postId: string, signal?: AbortSignal) {
        return api.get<PostRevisionsResponse>(`/posts/${postId}/revisions`, signal);
    },

    revision(postId: string, revisionId: string, signal?: AbortSignal) {
        return api.get<PostRevisionResponse>(`/posts/${postId}/revisions/${revisionId}`, signal);
    },

    createRevision(postId: string, payload: CreatePostRevisionPayload = {}, signal?: AbortSignal) {
        return api.post<PostRevisionResponse>(`/posts/${postId}/revisions`, payload, signal);
    },

    renameRevision(postId: string, revisionId: string, payload: RenamePostRevisionPayload, signal?: AbortSignal) {
        return api.put<PostRevisionListResponse>(`/posts/${postId}/revisions/${revisionId}`, payload, signal);
    },

    restoreRevision(postId: string, revisionId: string, signal?: AbortSignal) {
        return api.post<Post>(`/posts/${postId}/revisions/${revisionId}/restore`, {}, signal);
    },
};
