import { useState } from 'react';

import { nextRevealAnimation } from '@/lib/async-ui';

type RevealHistory = {
    resetKey: string | number;
    settledCount: number | null;
    wasLoading: boolean;
    animateEmpty: boolean;
    animateContent: boolean;
};

/**
 * Tracks settled list sizes so empty/content entrance motion only runs when
 * the transition is meaningful (not skeleton → empty on first paint).
 *
 * Pass `resetKey` when the list identity changes (e.g. Organize tab) so prior
 * counts do not leak across unrelated lists.
 */
export function useAsyncReveal(
    loading: boolean,
    itemCount: number,
    resetKey: string | number = ''
): {
    animateEmpty: boolean;
    animateContent: boolean;
} {
    const [history, setHistory] = useState<RevealHistory>(() => ({
        resetKey,
        settledCount: null,
        wasLoading: loading,
        animateEmpty: false,
        animateContent: false,
    }));

    let next = history;

    if (history.resetKey !== resetKey) {
        next = {
            resetKey,
            settledCount: null,
            wasLoading: loading,
            animateEmpty: false,
            animateContent: false,
        };
    } else if (history.wasLoading && !loading) {
        const anim = nextRevealAnimation(history.settledCount, itemCount);
        next = {
            resetKey,
            settledCount: itemCount,
            wasLoading: false,
            animateEmpty: anim.animateEmpty,
            animateContent: anim.animateContent,
        };
    } else if (!loading && history.settledCount !== itemCount) {
        const anim = nextRevealAnimation(history.settledCount, itemCount);
        next = {
            resetKey,
            settledCount: itemCount,
            wasLoading: false,
            animateEmpty: anim.animateEmpty,
            animateContent: anim.animateContent,
        };
    } else if (history.wasLoading !== loading) {
        next = { ...history, wasLoading: loading };
    }

    if (next !== history) {
        setHistory(next);
    }

    return {
        animateEmpty: next.animateEmpty,
        animateContent: next.animateContent,
    };
}
