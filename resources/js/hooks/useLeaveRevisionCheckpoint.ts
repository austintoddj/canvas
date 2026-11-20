import { useEffect, useRef } from 'react';

import { postsApi } from '@/lib/api/posts';
import {
    armLeaveRevisionCheckpoint,
    cancelLeaveRevisionCheckpoint,
    flushLeaveRevisionCheckpoint,
} from '@/lib/posts/leave-revision';

/**
 * Record a leave-editor checkpoint when the user leaves this post session.
 *
 * - SPA unmount / postId change: deferred send (Strict Mode safe)
 * - pagehide (tab close / hard nav): immediate send
 *
 * Server skips when content matches the latest checkpoint.
 */
export function useLeaveRevisionCheckpoint(postId: string | null, enabled: boolean, locale?: string): void {
    const enabledRef = useRef(enabled);

    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);

    useEffect(() => {
        if (postId === null || !enabled) {
            return undefined;
        }

        const id = locale ? `${postId}:${locale}` : postId;

        const send = () => postsApi.createRevision(postId, {}, undefined, locale);

        // Cancel any stale deferred leave for this id (Strict Mode remount).
        cancelLeaveRevisionCheckpoint(id);

        const onPageHide = () => {
            if (!enabledRef.current) {
                return;
            }

            flushLeaveRevisionCheckpoint(id, send);
        };

        window.addEventListener('pagehide', onPageHide);

        return () => {
            window.removeEventListener('pagehide', onPageHide);

            if (!enabledRef.current) {
                cancelLeaveRevisionCheckpoint(id);
                return;
            }

            armLeaveRevisionCheckpoint(id, send);
        };
    }, [postId, enabled, locale]);
}
