import { createContext, useMemo, type ReactNode } from 'react';

import { buildPermissions } from '@/lib/canvas-context-value';
import { loadTranslations } from '@/lib/i18n';
import type { CanvasContextValue, CanvasPermissions } from '@/lib/canvas-context-value';
import type { CanvasBoot } from '@/types/boot';

export type { CanvasContextValue, CanvasPermissions };

// Co-located with CanvasProvider to keep context and its consumer together; Fast Refresh is not a concern here.
// eslint-disable-next-line react-refresh/only-export-components
export const CanvasContext = createContext<CanvasContextValue | null>(null);

type CanvasProviderProps = {
    children: ReactNode;
    boot?: CanvasBoot;
};

export function CanvasProvider({ children, boot = window.Canvas }: CanvasProviderProps) {
    const value = useMemo((): CanvasContextValue => {
        const translator = loadTranslations(boot.translations);

        return {
            boot,
            user: boot.user,
            t: translator.t,
            permissions: buildPermissions(boot.user),
        };
    }, [boot]);

    return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}
