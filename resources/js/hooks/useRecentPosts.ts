import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import type { PostListItem, PostsIndexResponse } from '@/types/api';

export function useRecentPosts(limit = 5): { posts: PostListItem[]; loading: boolean } {
    const [posts, setPosts] = useState<PostListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        api.get<PostsIndexResponse>('/posts', controller.signal)
            .then((response) => {
                setPosts(response.posts.data.slice(0, limit));
            })
            .catch(() => {
                // Silently fail — sidebar section just won't render
            })
            .finally(() => {
                setLoading(false);
            });

        return () => controller.abort();
    }, [limit]);

    return { posts, loading };
}
