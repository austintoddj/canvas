import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

import { CONTENT_REVEAL_MS, CONTENT_REVEAL_OPACITY, shouldAnimateReveal } from '@/lib/async-ui';

type ContentRevealProps = {
    children: ReactNode;
    className?: string;
    /** Soft dim while refetching existing content (keeps previous paint visible). */
    busy?: boolean;
    /**
     * Play opacity entrance. Default true for filled mounts; pass false when
     * re-settling without a skeleton→data transition (e.g. pagination keep).
     */
    animate?: boolean;
};

/**
 * Opacity-only settle when a filled content region mounts (skeleton → data).
 * Empty states use EmptyStateReveal (lift). Skeletons mount with no motion.
 */
export function ContentReveal({ children, className, busy = false, animate = true }: ContentRevealProps) {
    const reducedMotion = useReducedMotion();
    const run = shouldAnimateReveal({ reducedMotion: reducedMotion === true, animate });

    return (
        <motion.div
            className={className}
            data-content-reveal="true"
            data-refreshing={busy ? 'true' : undefined}
            data-animate={run ? 'true' : 'false'}
            initial={run ? { opacity: 0 } : false}
            animate={{ opacity: busy ? CONTENT_REVEAL_OPACITY.busy : CONTENT_REVEAL_OPACITY.settled }}
            transition={{ duration: run ? CONTENT_REVEAL_MS / 1000 : 0, ease: 'easeOut' }}
            aria-busy={busy || undefined}
        >
            {children}
        </motion.div>
    );
}
