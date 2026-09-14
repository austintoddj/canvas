// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import {
    readSidebarCollapsed,
    SIDEBAR_COLLAPSED_STORAGE_KEY,
    useSidebarCollapsed,
    writeSidebarCollapsed,
} from '@/hooks/useSidebarCollapsed';

describe('useSidebarCollapsed', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('defaults to expanded when storage is empty', () => {
        expect(readSidebarCollapsed()).toBe(false);
    });

    it('reads collapsed preference from localStorage', () => {
        localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, '1');
        expect(readSidebarCollapsed()).toBe(true);

        localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, '0');
        expect(readSidebarCollapsed()).toBe(false);
    });

    it('persists collapsed preference', () => {
        writeSidebarCollapsed(true);
        expect(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe('1');

        writeSidebarCollapsed(false);
        expect(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe('0');
    });

    it('initializes from localStorage and toggles with persistence', () => {
        localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, '1');

        const { result } = renderHook(() => useSidebarCollapsed());
        expect(result.current.collapsed).toBe(true);

        act(() => {
            result.current.toggleCollapsed();
        });
        expect(result.current.collapsed).toBe(false);
        expect(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe('0');

        act(() => {
            result.current.setCollapsed(true);
        });
        expect(result.current.collapsed).toBe(true);
        expect(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe('1');
    });
});
