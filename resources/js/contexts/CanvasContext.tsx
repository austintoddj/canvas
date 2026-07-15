import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

import { buildPermissions } from '@/lib/canvas-context-value';
import { loadTranslations } from '@/lib/i18n';
import { fetchLocaleBootUpdate, syncWindowCanvas, withUpdatedUser } from '@/lib/locale-switch';
import type { CanvasContextValue, CanvasPermissions, Translate } from '@/lib/canvas-context-value';
import type { CanvasBoot, UserResource } from '@/types/boot';

export type { CanvasContextValue, CanvasPermissions };

// Co-located with CanvasProvider to keep context and its consumer together; Fast Refresh is not a concern here.
// eslint-disable-next-line react-refresh/only-export-components
export const CanvasContext = createContext<CanvasContextValue | null>(null);

type CanvasProviderProps = {
    children: ReactNode;
    boot?: CanvasBoot;
};

export function CanvasProvider({ children, boot: initialBoot = window.Canvas }: CanvasProviderProps) {
    const [boot, setBoot] = useState<CanvasBoot>(initialBoot);

    const switchLocale = useCallback(
        async (locale: string, signal?: AbortSignal) => {
            const base = window.Canvas ?? initialBoot;
            const next = await fetchLocaleBootUpdate(base, locale, signal);
            setBoot(next);
        },
        [initialBoot]
    );

    const setUser = useCallback((user: UserResource) => {
        setBoot((current) => {
            const next = withUpdatedUser(current, user);
            syncWindowCanvas(next);

            return next;
        });
    }, []);

    const value = useMemo((): CanvasContextValue => {
        const translator = loadTranslations(boot.translations);
        const t: Translate = translator.t.bind(translator);

        return {
            boot,
            user: boot.user,
            t,
            permissions: buildPermissions(boot.user),
            switchLocale,
            setUser,
        };
    }, [boot, setUser, switchLocale]);

    return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}
