import { useCallback, useEffect, useState } from 'react';

import { useCanvas } from '@/hooks/useCanvas';
import { api } from '@/lib/api';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'canvas-theme';

export function resolveInitialMode(serverTheme: ThemeMode | undefined): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;

    if (stored === 'system' || stored === 'light' || stored === 'dark') {
        return stored;
    }

    return serverTheme ?? 'system';
}

export function applyTheme(mode: ThemeMode): void {
    const html = document.documentElement;

    if (mode === 'dark') {
        html.classList.add('dark');
    } else if (mode === 'light') {
        html.classList.remove('dark');
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }
}

export function useTheme(): { mode: ThemeMode; setMode: (mode: ThemeMode) => void } {
    const { user } = useCanvas();
    const serverTheme = user.canvas?.theme;
    const [mode, setModeState] = useState<ThemeMode>(() => resolveInitialMode(serverTheme));

    useEffect(() => {
        applyTheme(mode);
    }, [mode]);

    // Keep 'system' mode in sync with OS preference changes
    useEffect(() => {
        if (mode !== 'system') return;

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => applyTheme('system');

        mq.addEventListener('change', handler);

        return () => mq.removeEventListener('change', handler);
    }, [mode]);

    const setMode = useCallback(
        (next: ThemeMode) => {
            setModeState(next);
            localStorage.setItem(STORAGE_KEY, next);
            api.post(`/users/${user.id}`, { theme: next }).catch(() => {});
        },
        [user.id]
    );

    return { mode, setMode };
}
