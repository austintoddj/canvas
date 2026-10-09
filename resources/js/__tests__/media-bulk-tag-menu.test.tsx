// @vitest-environment happy-dom

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MediaBulkTagMenu } from '@/components/media/MediaBulkTagMenu';
import { makeBoot, withCanvas } from '@/__tests__/helpers/boot';
import type { MediaTag } from '@/types/api';

const translations = {
    'media.tags_add': 'Add tag',
    'media.tags_query': 'Search or create',
    'media.tags_create': 'Create “:name”',
    'media.tags_none': 'No tags',
};

const tags: MediaTag[] = [
    { id: 'tag-sci', name: 'Sci Fi', media_count: 2 },
    { id: 'tag-city', name: 'City', media_count: 1 },
];

function renderMenu(props: Partial<React.ComponentProps<typeof MediaBulkTagMenu>> = {}) {
    const onPick = vi.fn();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
        withCanvas(
            <MediaBulkTagMenu tags={tags} onPick={onPick} onCreate={onCreate} {...props} />,
            makeBoot({ translations })
        )
    );

    return { onPick, onCreate };
}

describe('MediaBulkTagMenu', () => {
    it('opens a menu from the selection action and applies a tag without a dialog', async () => {
        const { onPick } = renderMenu();

        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.queryByRole('combobox', { name: 'Search or create' })).toBeNull();

        await userEvent.click(screen.getByRole('button', { name: 'Add tag' }));

        expect(screen.getByRole('combobox', { name: 'Search or create' })).toHaveFocus();
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
        await userEvent.click(await screen.findByRole('option', { name: 'Sci Fi' }));

        expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 'tag-sci', name: 'Sci Fi' }));
        await waitFor(() => {
            expect(screen.queryByRole('combobox', { name: 'Search or create' })).toBeNull();
        });
    });

    it('creates a tag from the field when the name is new', async () => {
        const { onCreate } = renderMenu();

        await userEvent.click(screen.getByRole('button', { name: 'Add tag' }));
        await userEvent.type(screen.getByRole('combobox', { name: 'Search or create' }), 'Poster');
        await userEvent.click(await screen.findByRole('option', { name: 'Create “Poster”' }));

        await waitFor(() => {
            expect(onCreate).toHaveBeenCalledWith('Poster');
        });
        await waitFor(() => {
            expect(screen.queryByRole('combobox', { name: 'Search or create' })).toBeNull();
        });
    });

    it('closes on escape', async () => {
        renderMenu();

        await userEvent.click(screen.getByRole('button', { name: 'Add tag' }));
        expect(await screen.findByRole('combobox', { name: 'Search or create' })).toBeInTheDocument();

        await userEvent.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByRole('combobox', { name: 'Search or create' })).toBeNull();
        });
    });
});
