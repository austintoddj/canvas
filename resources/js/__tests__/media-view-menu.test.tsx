// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MediaViewMenu } from '@/components/media/MediaViewMenu';
import { makeBoot, withCanvas } from '@/__tests__/helpers/boot';

const translations = {
    'media.file_type': 'File type',
    'media.sort_label': 'Sort media',
    'media.all_types': 'All types',
    'media.sort_newest': 'Newest first',
    'media.sort_oldest': 'Oldest first',
};

describe('MediaViewMenu', () => {
    it('keeps type and sort behind a compact control', async () => {
        const onMimeChange = vi.fn();
        const onSortChange = vi.fn();

        render(
            withCanvas(
                <MediaViewMenu mime="" sort="newest" onMimeChange={onMimeChange} onSortChange={onSortChange} />,
                makeBoot({ translations })
            )
        );

        expect(screen.queryByRole('menuitem', { name: 'PNG' })).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'File type, Sort media' }));
        await userEvent.click(await screen.findByRole('menuitem', { name: 'PNG' }));
        expect(onMimeChange).toHaveBeenCalledWith('image/png');
    });
});
