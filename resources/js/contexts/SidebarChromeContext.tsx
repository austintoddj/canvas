import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type SidebarChromeValue = {
    /** User preference: desktop rail collapsed. */
    collapsed: boolean;
    /** True when collapsed rail is active (collapsed + viewport ≥ lg). */
    rail: boolean;
    setCollapsed: (collapsed: boolean) => void;
    toggleCollapsed: () => void;
};

const SidebarChromeContext = createContext<SidebarChromeValue | null>(null);

const LG_QUERY = '(min-width: 1024px)';

function useIsDesktopLg(): boolean {
    const [isDesktop, setIsDesktop] = useState(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return true;
        }

        return window.matchMedia(LG_QUERY).matches;
    });

    useEffect(() => {
        if (typeof window.matchMedia !== 'function') {
            return;
        }

        const media = window.matchMedia(LG_QUERY);
        const sync = () => setIsDesktop(media.matches);

        sync();
        media.addEventListener('change', sync);

        return () => media.removeEventListener('change', sync);
    }, []);

    return isDesktop;
}

export function SidebarChromeProvider({
    collapsed,
    setCollapsed,
    toggleCollapsed,
    children,
}: {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    toggleCollapsed: () => void;
    children: ReactNode;
}) {
    const isDesktop = useIsDesktopLg();
    const rail = collapsed && isDesktop;

    const value = useMemo(
        () => ({ collapsed, rail, setCollapsed, toggleCollapsed }),
        [collapsed, rail, setCollapsed, toggleCollapsed]
    );

    return <SidebarChromeContext.Provider value={value}>{children}</SidebarChromeContext.Provider>;
}

const fallbackChrome: SidebarChromeValue = {
    collapsed: false,
    rail: false,
    setCollapsed: () => undefined,
    toggleCollapsed: () => undefined,
};

/** Read collapse/rail chrome; safe outside the provider (expanded defaults). */
// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useSidebarChrome(): SidebarChromeValue {
    return useContext(SidebarChromeContext) ?? fallbackChrome;
}
