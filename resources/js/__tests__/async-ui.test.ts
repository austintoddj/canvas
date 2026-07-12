import { describe, expect, it } from 'vitest';

import {
    CONTENT_REVEAL_MS,
    CONTENT_REVEAL_OPACITY,
    contentBusyClass,
    EMPTY_REVEAL_MS,
    EMPTY_REVEAL_Y,
    isInitialLoading,
    isRefreshing,
    nextRevealAnimation,
    shouldAnimateReveal,
    shouldShowEmpty,
} from '@/lib/async-ui';

describe('async-ui helpers', () => {
    it('classifies loading states and chooses reveal animations', () => {
        expect(isInitialLoading(true, 0)).toBe(true);
        expect(isInitialLoading(true, 3)).toBe(false);
        expect(isRefreshing(true, 4)).toBe(true);
        expect(isRefreshing(true, 0)).toBe(false);
        expect(shouldShowEmpty(false, 0)).toBe(true);
        expect(shouldShowEmpty(true, 0)).toBe(false);

        expect(shouldAnimateReveal({ reducedMotion: false, animate: true })).toBe(true);
        expect(shouldAnimateReveal({ reducedMotion: true, animate: true })).toBe(false);
        expect(nextRevealAnimation(null, 0)).toEqual({ animateEmpty: false, animateContent: false });
        expect(nextRevealAnimation(3, 0)).toEqual({ animateEmpty: true, animateContent: false });
        expect(nextRevealAnimation(null, 5)).toEqual({ animateEmpty: false, animateContent: true });
        expect(nextRevealAnimation(4, 4)).toEqual({ animateEmpty: false, animateContent: false });

        expect(CONTENT_REVEAL_MS).toBe(150);
        expect(CONTENT_REVEAL_OPACITY.busy).toBe(0.55);
        expect(contentBusyClass(true)).toContain('opacity-[0.55]');
        expect(EMPTY_REVEAL_MS).toBe(200);
        expect(EMPTY_REVEAL_Y).toBe(8);
    });
});
