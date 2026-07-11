/** Soft dim while refetching; never blank existing rows/tiles. */
export const CONTENT_REVEAL_OPACITY = {
    settled: 1,
    busy: 0.55,
} as const;

/** Content body opacity settle / dim — ~150ms feels instant without a hard cut. */
export const CONTENT_REVEAL_MS = 150;

/** Empty splash only — soft lift, slightly longer than list settle. */
export const EMPTY_REVEAL_MS = 200;

/** Vertical travel (px) for empty-state reveal; lists/skeletons stay at y=0. */
export const EMPTY_REVEAL_Y = 8;

export function isInitialLoading(loading: boolean, itemCount: number): boolean {
    return loading && itemCount === 0;
}

export function isRefreshing(loading: boolean, itemCount: number): boolean {
    return loading && itemCount > 0;
}

export function shouldShowEmpty(loading: boolean, itemCount: number): boolean {
    return !loading && itemCount === 0;
}

/**
 * Whether ContentReveal / EmptyStateReveal should play entrance motion.
 * Skip when reduced motion is preferred or the caller opts out (e.g. empty
 * after initial skeleton — avoids skeleton → empty thrash on empty apps).
 */
export function shouldAnimateReveal(options: { reducedMotion: boolean; animate: boolean }): boolean {
    return options.animate && !options.reducedMotion;
}

/**
 * After a settled response, decide entrance animation for the next body.
 * - Empty: animate only when the list previously had items (e.g. last delete).
 * - Filled: animate only on first settle or when coming from empty.
 */
export function nextRevealAnimation(
    previousItemCount: number | null,
    nextItemCount: number
): { animateEmpty: boolean; animateContent: boolean } {
    if (nextItemCount === 0) {
        return {
            animateEmpty: previousItemCount !== null && previousItemCount > 0,
            animateContent: false,
        };
    }

    return {
        animateEmpty: false,
        animateContent: previousItemCount === null || previousItemCount === 0,
    };
}

/** CSS-class alternative when motion/ContentReveal is not used. */
export function contentBusyClass(busy: boolean): string {
    return busy
        ? 'opacity-[0.55] transition-opacity duration-150 ease-out'
        : 'transition-opacity duration-150 ease-out';
}
