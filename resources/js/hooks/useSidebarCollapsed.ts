import { useCallback, useState } from 'react';

export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'canvas-sidebar-collapsed';

export function readSidebarCollapsed(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
    try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
        // Ignore quota / private mode failures — in-memory state still works.
    }
}

export function useSidebarCollapsed(): {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    toggleCollapsed: () => void;
} {
    const [collapsed, setCollapsedState] = useState(() => readSidebarCollapsed());

    const setCollapsed = useCallback((next: boolean) => {
        setCollapsedState(next);
        writeSidebarCollapsed(next);
    }, []);

    const toggleCollapsed = useCallback(() => {
        setCollapsedState((prev) => {
            const next = !prev;
            writeSidebarCollapsed(next);
            return next;
        });
    }, []);

    return { collapsed, setCollapsed, toggleCollapsed };
}
