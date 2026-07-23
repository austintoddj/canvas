// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { invalidateRecentPosts, subscribeRecentPosts } from '@/hooks/useRecentPosts';

describe('recent posts invalidation', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('notifies subscribers and supports unsubscribe', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeRecentPosts(listener);

        invalidateRecentPosts();
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenLastCalledWith(undefined);

        invalidateRecentPosts({ removeId: 'post-1' });
        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenLastCalledWith({ removeId: 'post-1' });

        unsubscribe();
        invalidateRecentPosts({ removeId: 'post-2' });
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('is a no-op when there are no subscribers', () => {
        expect(() => invalidateRecentPosts()).not.toThrow();
        expect(() => invalidateRecentPosts({ removeId: 'abc' })).not.toThrow();
    });
});
