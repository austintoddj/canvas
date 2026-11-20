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

function localized(path: string, locale?: string): string {
    return locale ? `${path}${buildQueryString({ locale })}` : path;
}

export const postsApi = {
    index(params: PostsIndexParams = {}, signal?: AbortSignal) {
        return api.get<PostsIndexResponse>(`/posts${buildQueryString(params)}`, signal);
    },

    create(signal?: AbortSignal) {
        return api.get<PostCreateResponse>('/posts/create', signal);
    },

    show(id: string, signal?: AbortSignal, locale?: string) {
        return api.get<PostShowResponse>(localized(`/posts/${id}`, locale), signal);
    },

    stats(id: string, signal?: AbortSignal) {
        return api.get<PostStatsResponse>(`/posts/${id}/stats`, signal);
    },

    store(id: string, payload: PostStorePayload, signal?: AbortSignal, locale?: string) {
        return api.post<Post>(localized(`/posts/${id}`, locale), payload, signal);
    },

    discard(id: string, signal?: AbortSignal, locale?: string) {
        return api.post<Post>(localized(`/posts/${id}/discard`, locale), {}, signal);
    },

    destroy(id: string, signal?: AbortSignal) {
        return api.delete<null>(`/posts/${id}`, signal);
    },

    revisions(postId: string, signal?: AbortSignal, locale?: string) {
        return api.get<PostRevisionsResponse>(localized(`/posts/${postId}/revisions`, locale), signal);
    },

    revision(postId: string, revisionId: string, signal?: AbortSignal, locale?: string) {
        return api.get<PostRevisionResponse>(localized(`/posts/${postId}/revisions/${revisionId}`, locale), signal);
    },

    createRevision(postId: string, payload: CreatePostRevisionPayload = {}, signal?: AbortSignal, locale?: string) {
        return api.post<PostRevisionResponse>(localized(`/posts/${postId}/revisions`, locale), payload, signal);
    },

    renameRevision(
        postId: string,
        revisionId: string,
        payload: RenamePostRevisionPayload,
        signal?: AbortSignal,
        locale?: string
    ) {
        return api.put<PostRevisionListResponse>(
            localized(`/posts/${postId}/revisions/${revisionId}`, locale),
            payload,
            signal
        );
    },

    restoreRevision(postId: string, revisionId: string, signal?: AbortSignal, locale?: string) {
        return api.post<Post>(localized(`/posts/${postId}/revisions/${revisionId}/restore`, locale), {}, signal);
    },
};
