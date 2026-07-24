/**
 * Route-owned mobile primary actions. Resolved from the URL so the navbar
 * control is present during lazy-route Suspense and initial list fetches —
 * pages only suppress (empty states) or attach handlers/labels.
 */

export type MobilePageActionKind = 'new-post' | 'upload' | 'new-taxonomy' | 'invite';

/** Pathname without basename (react-router `location.pathname`). */
export function mobilePageActionKindForPath(pathname: string): MobilePageActionKind | null {
    if (pathname === '/' || pathname === '') {
        return 'new-post';
    }

    if (pathname === '/posts') {
        return 'new-post';
    }

    if (pathname === '/media') {
        return 'upload';
    }

    if (pathname === '/organize') {
        return 'new-taxonomy';
    }

    if (pathname === '/users') {
        return 'invite';
    }

    return null;
}
