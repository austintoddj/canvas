/**
 * Leave-editor checkpoint scheduling.
 *
 * React Strict Mode remounts effects in dev (mount → cleanup → mount). A raw
 * cleanup POST would spam checkpoints. Defer the request and cancel if the same
 * post id is re-armed before the delay elapses.
 */

const LEAVE_CHECKPOINT_DELAY_MS = 150;

const pendingByPostId = new Map<string, ReturnType<typeof setTimeout>>();
/** In-flight / just-sent guard so pagehide + deferred cleanup do not double-post. */
const sendingPostIds = new Set<string>();

export type LeaveRevisionSender = (postId: string) => Promise<unknown>;

/** Test helper — clears timers and send locks. */
export function resetLeaveRevisionScheduler(): void {
    for (const timer of pendingByPostId.values()) {
        clearTimeout(timer);
    }
    pendingByPostId.clear();
    sendingPostIds.clear();
}

/**
 * Arm a deferred leave checkpoint. Calling again for the same postId cancels
 * the previous timer (Strict Mode remount / effect re-run).
 */
export function armLeaveRevisionCheckpoint(postId: string, send: LeaveRevisionSender): void {
    cancelLeaveRevisionCheckpoint(postId);

    const timer = setTimeout(() => {
        pendingByPostId.delete(postId);
        void dispatchLeaveRevision(postId, send);
    }, LEAVE_CHECKPOINT_DELAY_MS);

    pendingByPostId.set(postId, timer);
}

export function cancelLeaveRevisionCheckpoint(postId: string): void {
    const timer = pendingByPostId.get(postId);

    if (timer !== undefined) {
        clearTimeout(timer);
        pendingByPostId.delete(postId);
    }
}

/** Fire immediately (pagehide / hard navigation). Cancels any deferred arm first. */
export function flushLeaveRevisionCheckpoint(postId: string, send: LeaveRevisionSender): void {
    cancelLeaveRevisionCheckpoint(postId);
    void dispatchLeaveRevision(postId, send);
}

async function dispatchLeaveRevision(postId: string, send: LeaveRevisionSender): Promise<void> {
    if (sendingPostIds.has(postId)) {
        return;
    }

    sendingPostIds.add(postId);

    try {
        await send(postId);
    } catch {
        // Leave is best-effort: empty content 422, network blips, aborted navigations.
    } finally {
        sendingPostIds.delete(postId);
    }
}
