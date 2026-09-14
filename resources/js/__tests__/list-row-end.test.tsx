// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ListRowActionButton, ListRowActionLink } from '@/components/ListRowEnd';
import { MemoryRouter } from 'react-router-dom';

import { matchMediaFinePointerHover, stubMatchMedia } from './helpers/dom';

beforeEach(() => {
    stubMatchMedia(matchMediaFinePointerHover);
});

describe('ListRowActionButton', () => {
    it('shows a concise tooltip on fine-pointer hover and keeps the descriptive aria-label', async () => {
        render(
            <ListRowActionButton label="Delete Hello World" tooltip="Delete">
                <span>icon</span>
            </ListRowActionButton>
        );

        const button = screen.getByRole('button', { name: 'Delete Hello World' });
        expect(button).not.toHaveAttribute('title');

        fireEvent.mouseEnter(button);

        await waitFor(() => {
            expect(screen.getByRole('tooltip')).toHaveTextContent('Delete');
        });
    });

    it('does not show a tooltip without fine-pointer hover', () => {
        stubMatchMedia(() => false);

        render(
            <ListRowActionButton label="Delete Hello World" tooltip="Delete">
                <span>icon</span>
            </ListRowActionButton>
        );

        fireEvent.mouseEnter(screen.getByRole('button', { name: 'Delete Hello World' }));
        expect(screen.queryByRole('tooltip')).toBeNull();
    });
});

describe('ListRowActionLink', () => {
    it('shows a concise tooltip on fine-pointer hover for stats links', async () => {
        render(
            <MemoryRouter>
                <ListRowActionLink href="/posts/1/stats" label="View stats for Hello World" tooltip="Stats">
                    <span>icon</span>
                </ListRowActionLink>
            </MemoryRouter>
        );

        const link = screen.getByRole('link', { name: 'View stats for Hello World' });
        expect(link).not.toHaveAttribute('title');

        fireEvent.mouseEnter(link);

        await waitFor(() => {
            expect(screen.getByRole('tooltip')).toHaveTextContent('Stats');
        });
    });
});
