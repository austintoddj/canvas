import { useOutlet } from 'react-router-dom';

/**
 * Instant route body swap. Known chrome is static; filled lists use
 * ContentReveal; empty states use EmptyStateReveal; loading uses skeletons.
 */
export function AnimatedOutlet() {
    const outlet = useOutlet();

    return <div data-page-transition="true">{outlet}</div>;
}
