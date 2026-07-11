import { describe, expect, it } from 'vitest';

import contentRevealSource from '@/components/ContentReveal.tsx?raw';
import emptyStateRevealSource from '@/components/EmptyStateReveal.tsx?raw';
import pageFallbackSource from '@/components/PageFallback.tsx?raw';
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

describe('async-ui loading helpers', () => {
    it('treats loading with no items as the initial skeleton state', () => {
        expect(isInitialLoading(true, 0)).toBe(true);
        expect(isInitialLoading(true, 3)).toBe(false);
        expect(isInitialLoading(false, 0)).toBe(false);
    });

    it('treats loading with existing items as a refresh', () => {
        expect(isRefreshing(true, 4)).toBe(true);
        expect(isRefreshing(true, 0)).toBe(false);
        expect(isRefreshing(false, 4)).toBe(false);
    });

    it('shows empty only when settled with zero items', () => {
        expect(shouldShowEmpty(false, 0)).toBe(true);
        expect(shouldShowEmpty(true, 0)).toBe(false);
        expect(shouldShowEmpty(false, 2)).toBe(false);
    });

    it('skips reveal animation when reduced motion or animate is false', () => {
        expect(shouldAnimateReveal({ reducedMotion: false, animate: true })).toBe(true);
        expect(shouldAnimateReveal({ reducedMotion: true, animate: true })).toBe(false);
        expect(shouldAnimateReveal({ reducedMotion: false, animate: false })).toBe(false);
    });

    it('does not animate empty after first paint with zero items', () => {
        expect(nextRevealAnimation(null, 0)).toEqual({ animateEmpty: false, animateContent: false });
        expect(nextRevealAnimation(0, 0)).toEqual({ animateEmpty: false, animateContent: false });
    });

    it('animates empty only when the list previously had items', () => {
        expect(nextRevealAnimation(3, 0)).toEqual({ animateEmpty: true, animateContent: false });
    });

    it('animates content on first filled settle or empty→filled', () => {
        expect(nextRevealAnimation(null, 5)).toEqual({ animateEmpty: false, animateContent: true });
        expect(nextRevealAnimation(0, 2)).toEqual({ animateEmpty: false, animateContent: true });
        expect(nextRevealAnimation(4, 4)).toEqual({ animateEmpty: false, animateContent: false });
    });

    it('exposes opacity-only content reveal timings (no vertical travel)', () => {
        expect(CONTENT_REVEAL_MS).toBe(150);
        expect(CONTENT_REVEAL_OPACITY.busy).toBe(0.55);
        expect(CONTENT_REVEAL_OPACITY.settled).toBe(1);
        expect(contentBusyClass(true)).toContain('opacity-[0.55]');
        expect(contentBusyClass(false)).toContain('transition-opacity');
        expect(contentRevealSource).toContain('data-content-reveal');
        expect(contentRevealSource).toContain('CONTENT_REVEAL_OPACITY');
        expect(contentRevealSource).toContain('shouldAnimateReveal');
        expect(contentRevealSource).toContain('useReducedMotion');
        expect(contentRevealSource).toContain('opacity: 0');
        expect(contentRevealSource).not.toMatch(/[,{]\s*y:\s*/);
    });

    it('exposes empty-state lift timings separate from filled content', () => {
        expect(EMPTY_REVEAL_MS).toBe(200);
        expect(EMPTY_REVEAL_Y).toBe(8);
        expect(emptyStateRevealSource).toContain('data-empty-state-reveal');
        expect(emptyStateRevealSource).toContain('EMPTY_REVEAL_Y');
        expect(emptyStateRevealSource).toContain('shouldAnimateReveal');
        expect(emptyStateRevealSource).toContain('useReducedMotion');
        expect(emptyStateRevealSource).toMatch(/y:\s*EMPTY_REVEAL_Y/);
    });

    it('uses a neutral page fallback instead of a media grid shape', () => {
        expect(pageFallbackSource).toContain('data-page-fallback');
        expect(pageFallbackSource).toContain('aria-busy');
        expect(pageFallbackSource).not.toContain('aspect-square');
        expect(pageFallbackSource).not.toContain('grid-cols-2');
        expect(pageFallbackSource).not.toContain('grid-cols-4');
    });
});
