import { useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';

/**
 * Instant route body swap. Known chrome is static; filled lists use
 * ContentReveal; empty states use EmptyStateReveal; loading uses skeletons.
 *
 * Scroll the real document (admin shell is document-scrolled, not a nested
 * overflow pane) to the top on pathname change so deep links and in-app
 * navigations never inherit the previous page's scroll offset.
 */
export function AnimatedOutlet() {
    const outlet = useOutlet();
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return <div data-page-transition="true">{outlet}</div>;
}
