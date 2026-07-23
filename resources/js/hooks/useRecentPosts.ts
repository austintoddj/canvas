import { useEffect, useState } from 'react';

import { postsApi } from '@/lib/api/posts';
import type { PostListItem } from '@/types/api';

export type RecentPostsInvalidation = {
    removeId?: string;
};

type Listener = (invalidation?: RecentPostsInvalidation) => void;

const listeners = new Set<Listener>();

export function invalidateRecentPosts(invalidation?: RecentPostsInvalidation): void {
    for (const listener of listeners) {
        listener(invalidation);
    }
}

export function subscribeRecentPosts(listener: Listener): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

export function useRecentPosts(limit = 5): { posts: PostListItem[]; loading: boolean } {
    const [posts, setPosts] = useState<PostListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [revision, setRevision] = useState(0);

    useEffect(
        () =>
            subscribeRecentPosts((invalidation) => {
                if (invalidation?.removeId !== undefined) {
                    const removeId = invalidation.removeId;
                    setPosts((current) => current.filter((post) => post.id !== removeId));
                }

                setRevision((current) => current + 1);
            }),
        []
    );

    useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;

        postsApi
            .index(undefined, controller.signal)
            .then((response) => {
                if (!cancelled) {
                    setPosts(response.posts.data.slice(0, limit));
                }
            })
            .catch(() => {
                // Silently fail — sidebar section keeps prior items or stays hidden
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [limit, revision]);

    return { posts, loading };
}
