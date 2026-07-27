import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Page-layer contribution on top of the route default.
 * - `visible: false` hides the control (empty state owns the CTA).
 * - Omit `visible` (or true) to keep the route default showing through load/Suspense.
 * - `onClick` / `disabled` / `label` refine button actions once the page is mounted.
 */
export type MobilePageActionContribution = {
    visible?: boolean;
    label?: string;
    disabled?: boolean;
    onClick?: () => void;
};

type MobilePageActionContextValue = {
    contribution: MobilePageActionContribution;
    setContribution: (next: MobilePageActionContribution) => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const MobilePageActionContext = createContext<MobilePageActionContextValue | null>(null);

const EMPTY: MobilePageActionContribution = {};

export function MobilePageActionProvider({ children }: { children: ReactNode }) {
    const { pathname } = useLocation();
    const [contribution, setContributionState] = useState<MobilePageActionContribution>(EMPTY);
    const [contributionPath, setContributionPath] = useState(pathname);

    // Drop stale page handlers as soon as the route changes (before paint).
    if (contributionPath !== pathname) {
        setContributionPath(pathname);
        setContributionState(EMPTY);
    }

    const setContribution = useCallback((next: MobilePageActionContribution) => {
        setContributionState(next);
    }, []);

    const value = useMemo(
        (): MobilePageActionContextValue => ({
            contribution,
            setContribution,
        }),
        [contribution, setContribution]
    );

    return <MobilePageActionContext.Provider value={value}>{children}</MobilePageActionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMobilePageActionState(): MobilePageActionContextValue {
    const context = useContext(MobilePageActionContext);

    if (context === null) {
        throw new Error('useMobilePageActionState must be used within a MobilePageActionProvider');
    }

    return context;
}
