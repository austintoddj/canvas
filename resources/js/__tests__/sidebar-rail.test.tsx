// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Sidebar, SidebarItem, SidebarLabel } from '@/components/sidebar';
import { SidebarChromeProvider } from '@/contexts/SidebarChromeContext';
import { IconLayoutDashboard } from '@tabler/icons-react';

afterEach(() => {
    cleanup();
});

beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: query.includes('min-width: 1024px') || (query.includes('hover') && query.includes('fine')),
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })),
    });
});

function renderSidebar(collapsed: boolean) {
    return render(
        <MemoryRouter>
            <SidebarChromeProvider
                collapsed={collapsed}
                setCollapsed={() => undefined}
                toggleCollapsed={() => undefined}
            >
                <Sidebar>
                    <SidebarItem href="/" current tooltip="Dashboard">
                        <IconLayoutDashboard data-slot="icon" />
                        <SidebarLabel>Dashboard</SidebarLabel>
                    </SidebarItem>
                </Sidebar>
            </SidebarChromeProvider>
        </MemoryRouter>
    );
}

describe('Sidebar rail chrome', () => {
    it('exposes visible label text when expanded', () => {
        renderSidebar(false);
        const label = screen.getByText('Dashboard');
        expect(label.className).not.toContain('sr-only');
        expect(document.querySelector('[data-sidebar-rail]')).toBeNull();
    });

    it('visually hides label when collapsed on desktop (rail)', () => {
        renderSidebar(true);
        const label = screen.getByText('Dashboard');
        expect(label.className).toContain('sr-only');
        expect(document.querySelector('[data-sidebar-rail="true"]')).not.toBeNull();
    });

    it('keeps full-width hit targets when expanded (no tooltip wrapper)', () => {
        renderSidebar(false);
        const link = screen.getByRole('link');
        const row = link.parentElement;
        expect(row?.className).toMatch(/\bw-full\b/);
        expect(row?.className).toMatch(/\bblock\b/);
        // Tooltip trigger must not wrap expanded rows
        expect(row?.parentElement?.getAttribute('aria-describedby')).toBeNull();
    });

    it('uses square hit targets when collapsed on desktop', () => {
        renderSidebar(true);
        const link = screen.getByRole('link');
        expect(link.className).toMatch(/\bsize-9\b/);
        expect(link.className).not.toMatch(/\bw-full\b/);
    });
});
