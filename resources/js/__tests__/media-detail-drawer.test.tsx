// @vitest-environment happy-dom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaDetailDrawer } from '@/components/media/MediaDetailDrawer';
import { CanvasContext, type CanvasContextValue } from '@/contexts/CanvasContext';
import { createTranslator } from '@/lib/i18n';
import type { Media } from '@/types/api';

const showMock = vi.fn();

vi.mock('@/lib/api/media', () => ({
    mediaApi: {
        show: (...args: unknown[]) => showMock(...args),
        update: vi.fn(),
        destroy: vi.fn(),
    },
}));

vi.mock('@/lib/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const dictionary = {
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
    const translator = createTranslator(dictionary);
    const value = {
        t: translator.t,
        user: {
            id: 1,
            name: 'Admin',
            email: 'a@example.com',
            avatar_url: null,
            dark_mode: false,
            locale: 'en',
            canvas: null,
        },
    } as unknown as CanvasContextValue;

    return render(
        <CanvasContext.Provider value={value}>
            <MediaDetailDrawer open mediaId="media-1" onClose={() => undefined} {...props} />
        </CanvasContext.Provider>
    );
}

beforeEach(() => {
    showMock.mockReset();
});

afterEach(() => {
    cleanup();
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
});
