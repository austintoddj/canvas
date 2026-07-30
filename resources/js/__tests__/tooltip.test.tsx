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

    it('hides on pointer down so opening a control does not leave the tip stuck', async () => {
        render(
            <Tooltip content="Settings" delayMs={0}>
                <button type="button">Open</button>
            </Tooltip>
        );

        const button = screen.getByRole('button', { name: 'Open' });
        fireEvent.mouseEnter(button);

        await waitFor(() => {
            expect(screen.getByRole('tooltip')).toBeInTheDocument();
        });

        fireEvent.pointerDown(button);
        expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('does not show on non-keyboard focus (e.g. dialog focus restore)', () => {
        const originalMatches = Element.prototype.matches;
        const matchesSpy = vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
            this: Element,
            selectors: string
        ) {
            if (selectors === ':focus-visible') {
                return false;
            }

            return originalMatches.call(this, selectors);
        });

        render(
            <Tooltip content="History" delayMs={0}>
                <button type="button">Versions</button>
            </Tooltip>
        );

        fireEvent.focus(screen.getByRole('button', { name: 'Versions' }));
        expect(screen.queryByRole('tooltip')).toBeNull();

        matchesSpy.mockRestore();
    });

    it('shows on keyboard focus-visible', async () => {
        const originalMatches = Element.prototype.matches;
        const matchesSpy = vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
            this: Element,
            selectors: string
        ) {
            if (selectors === ':focus-visible') {
                return true;
            }

            return originalMatches.call(this, selectors);
        });

        render(
            <Tooltip content="History" delayMs={0}>
                <button type="button">Versions</button>
            </Tooltip>
        );

        fireEvent.focus(screen.getByRole('button', { name: 'Versions' }));

        await waitFor(() => {
            expect(screen.getByRole('tooltip')).toHaveTextContent('History');
        });

        matchesSpy.mockRestore();
    });
});
