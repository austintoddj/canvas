// @vitest-environment happy-dom

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaDetailDrawer } from '@/components/media/MediaDetailDrawer';
import { makeBoot, withCanvas } from '@/__tests__/helpers/boot';
import { toast } from '@/lib/toast';
import type { Media } from '@/types/api';
import userEvent from '@testing-library/user-event';

const showMock = vi.fn();
const updateMock = vi.fn();
const attachMock = vi.fn();
const detachMock = vi.fn();
const tagsIndexMock = vi.fn();

vi.mock('@/lib/api/media', () => ({
    mediaApi: {
        show: (...args: unknown[]) => showMock(...args),
        update: (...args: unknown[]) => updateMock(...args),
        destroy: vi.fn(),
    },
}));

vi.mock('@/lib/api/media-tags', () => ({
    mediaTagsApi: {
        index: (...args: unknown[]) => tagsIndexMock(...args),
        attach: (...args: unknown[]) => attachMock(...args),
        detach: (...args: unknown[]) => detachMock(...args),
        create: vi.fn(),
        store: vi.fn(),
        destroy: vi.fn(),
    },
    createOrReuseMediaTag: vi.fn(),
}));

vi.mock('@/lib/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const dictionary = {
    'media.tags': 'Tags',
    'media.tags_none': 'No tags',
    'media.tags_add': 'Add tag',
    'media.tags_attached': 'Added to “:name”.',
    'media.tags_detached': 'Tag removed.',
    'media.details_title': 'Media details',
    'media.close_details': 'Close details',
    'media.loading': 'Loading media…',
    'media.load_item_error': 'Unable to load media.',
    'media.this_image': 'This image',
    'common.details': 'Details',
    'common.type': 'Type',
    'media.size': 'Size',
    'media.dimensions': 'Dimensions',
    'media.uploaded': 'Uploaded',
    'media.filename': 'Filename',
    'media.metadata': 'Metadata',
    'media.display_name': 'Display name',
    'media.alt_text': 'Alt text',
    'media.caption': 'Caption',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.saving': 'Saving…',
    'media.delete_title': 'Delete media',
    'media.delete_confirm_body': 'Delete :name?',
    'common.cancel': 'Cancel',
    'common.deleting': 'Deleting…',
};

function sampleMedia(overrides: Partial<Media> = {}): Media {
    return {
        id: 'media-1',
        user_id: 1,
        filename: 'hero.jpg',
        original_name: 'Hero shot',
        url: 'https://example.com/hero.jpg',
        path: 'hero.jpg',
        mime_type: 'image/jpeg',
        size: 12000,
        width: 800,
        height: 600,
        alt: null,
        caption: null,
        type: 'image',
        created_at: '2026-07-01T00:00:00.000000Z',
        updated_at: '2026-07-01T00:00:00.000000Z',
        user: null,
        ...overrides,
    };
}

function renderDrawer(props: Partial<React.ComponentProps<typeof MediaDetailDrawer>> = {}) {
    return render(
        withCanvas(
            <MediaDetailDrawer open mediaId="media-1" onClose={() => undefined} {...props} />,
            makeBoot({ translations: dictionary })
        )
    );
}

beforeEach(() => {
    showMock.mockReset();
    updateMock.mockReset();
    attachMock.mockReset();
    detachMock.mockReset();
    tagsIndexMock.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
    tagsIndexMock.mockResolvedValue({
        data: [{ id: 'tag-1', name: 'Hero', media_count: 1 }],
        meta: { all_count: 1, untagged_count: 0, truncated: false },
    });
    attachMock.mockResolvedValue({ attached: ['media-1'], skipped: [], media_count: 1 });
    detachMock.mockResolvedValue({ detached: ['media-1'], skipped: [], media_count: 0 });
});

describe('MediaDetailDrawer loading', () => {
    it('shows a skeleton while media is loading (not plain loading text)', async () => {
        let resolveShow: (value: Media) => void = () => undefined;
        showMock.mockReturnValue(
            new Promise((resolve) => {
                resolveShow = resolve;
            })
        );

        renderDrawer();

        expect(document.querySelector('[data-media-detail-skeleton="true"]')).not.toBeNull();
        expect(screen.queryByText('Loading media…')).toBeNull();

        resolveShow(sampleMedia());

        await waitFor(() => {
            expect(document.querySelector('[data-media-detail-skeleton="true"]')).toBeNull();
        });
        expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('attaches a tag immediately without saving alt or caption', async () => {
        showMock.mockResolvedValue(sampleMedia({ tags: [] }));

        renderDrawer();

        await waitFor(() => {
            expect(screen.getByText('Tags')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('combobox', { name: 'Add tag' }));
        await userEvent.click(await screen.findByText('Hero'));

        await waitFor(() => {
            expect(attachMock).toHaveBeenCalledWith('tag-1', { media_ids: ['media-1'] });
        });
        expect(toast.success).toHaveBeenCalledWith('Added to “Hero”.');
        expect(updateMock).not.toHaveBeenCalled();
    });
});
