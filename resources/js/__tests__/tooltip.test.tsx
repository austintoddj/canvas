// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Tooltip } from '@/components/tooltip';

afterEach(() => {
    cleanup();
});

beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: query.includes('hover') && query.includes('pointer: fine'),
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })),
    });
});

describe('Tooltip', () => {
    it('does not show when disabled', () => {
        render(
            <Tooltip content="Dashboard" disabled delayMs={0}>
                <button type="button">Nav</button>
            </Tooltip>
        );

        fireEvent.mouseEnter(screen.getByRole('button', { name: 'Nav' }));
        expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('shows content on hover when enabled', async () => {
        render(
            <Tooltip content="Dashboard" delayMs={0}>
                <button type="button">Nav</button>
            </Tooltip>
        );

        fireEvent.mouseEnter(screen.getByRole('button', { name: 'Nav' }));

        await waitFor(() => {
            expect(screen.getByRole('tooltip')).toHaveTextContent('Dashboard');
        });
    });
});
