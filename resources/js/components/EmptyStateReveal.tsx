import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

import { EMPTY_REVEAL_MS, EMPTY_REVEAL_Y, shouldAnimateReveal } from '@/lib/async-ui';

type EmptyStateRevealProps = {
    children: ReactNode;
    className?: string;
    /**
     * Soft lift entrance. Pass false after initial skeleton→empty so empty apps
     * settle without thrash; true when emptying a list that had items.
     */
    animate?: boolean;
};

/**
 * Soft lift + fade for settled empty states only.
 * Loading uses skeletons (instant); filled lists use ContentReveal (opacity only).
 */
export function EmptyStateReveal({ children, className, animate = true }: EmptyStateRevealProps) {
    const reducedMotion = useReducedMotion();
    const run = shouldAnimateReveal({ reducedMotion: reducedMotion === true, animate });

    return (
        <motion.div
            className={className}
            data-empty-state-reveal="true"
            data-animate={run ? 'true' : 'false'}
            initial={run ? { opacity: 0, y: EMPTY_REVEAL_Y } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: run ? EMPTY_REVEAL_MS / 1000 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}
