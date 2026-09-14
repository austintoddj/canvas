import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    armLeaveRevisionCheckpoint,
    cancelLeaveRevisionCheckpoint,
    flushLeaveRevisionCheckpoint,
    resetLeaveRevisionScheduler,
} from '@/lib/posts/leave-revision';

describe('leave-revision scheduler', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetLeaveRevisionScheduler();
    });

    afterEach(() => {
        resetLeaveRevisionScheduler();
        vi.useRealTimers();
    });

    it('defers the leave send and fires after the delay', async () => {
        const send = vi.fn().mockResolvedValue(undefined);

        armLeaveRevisionCheckpoint('post-1', send);

        expect(send).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(150);

        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith('post-1');
    });

    it('cancels a deferred leave when re-armed (Strict Mode remount)', async () => {
        const send = vi.fn().mockResolvedValue(undefined);

        armLeaveRevisionCheckpoint('post-1', send);
        armLeaveRevisionCheckpoint('post-1', send);

        await vi.advanceTimersByTimeAsync(150);

        expect(send).toHaveBeenCalledTimes(1);
    });

    it('cancels a deferred leave entirely', async () => {
        const send = vi.fn().mockResolvedValue(undefined);

        armLeaveRevisionCheckpoint('post-1', send);
        cancelLeaveRevisionCheckpoint('post-1');

        await vi.advanceTimersByTimeAsync(200);

        expect(send).not.toHaveBeenCalled();
    });

    it('flush sends immediately and does not double-fire with a prior arm', async () => {
        const send = vi.fn().mockResolvedValue(undefined);

        armLeaveRevisionCheckpoint('post-1', send);
        flushLeaveRevisionCheckpoint('post-1', send);

        expect(send).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(200);

        expect(send).toHaveBeenCalledTimes(1);
    });

    it('does not send twice while the first request is in flight', async () => {
        let resolveSend: (() => void) | undefined;
        const send = vi.fn(
            () =>
                new Promise<void>((resolve) => {
                    resolveSend = resolve;
                })
        );

        flushLeaveRevisionCheckpoint('post-1', send);
        flushLeaveRevisionCheckpoint('post-1', send);

        expect(send).toHaveBeenCalledTimes(1);

        resolveSend?.();
        await vi.advanceTimersByTimeAsync(0);
    });
});
