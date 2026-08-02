// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ImageSourcePicker from '@/components/media/ImageSourcePicker';
import MediaPicker from '@/components/media/MediaPicker';
import { CanvasContext } from '@/contexts/CanvasContext';
import { makeCanvasValue, makeBoot } from '@/__tests__/helpers/boot';
import { loadTranslations } from '@/lib/i18n';

vi.mock('@/lib/api/media', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/api/media')>();

    return {
        ...actual,
        mediaApi: {
            ...actual.mediaApi,
            index: vi.fn().mockResolvedValue({
                data: [],
                current_page: 1,
                last_page: 1,
                per_page: 24,
                total: 0,
            }),
        },
        unsupportedTypeMessage: () => 'unsupported',
        uploadMedia: vi.fn(),
    };
});

vi.mock('@/lib/api/unsplash', () => ({
    unsplashApi: {
        search: vi.fn().mockResolvedValue({ results: [], total_pages: 1 }),
    },
}));

afterEach(() => {
    cleanup();
});

describe('image pickers close control', () => {
    it('exposes a close button on ImageSourcePicker (library-only)', () => {
        const value = makeCanvasValue(
            makeBoot({
                unsplash: false,
                translations: JSON.stringify({
                    'common.close': 'Close',
                    'editor.choose_image': 'Choose image',
                    'media.browse': 'Browse your media library or upload a new image.',
                    'media.title': 'Media',
                }),
            })
        );

        render(
            <CanvasContext.Provider value={value}>
                <ImageSourcePicker open onClose={() => undefined} onSelect={() => undefined} title="Choose avatar" />
            </CanvasContext.Provider>
        );

        expect(document.querySelector('[data-image-source-picker="true"]')).not.toBeNull();
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
        expect(screen.getByText('Choose avatar')).toBeInTheDocument();
    });

    it('exposes a close button on ImageSourcePicker with Unsplash tabs', () => {
        const value = makeCanvasValue(
            makeBoot({
                unsplash: true,
                translations: JSON.stringify({
                    'common.close': 'Close',
                    'editor.choose_image': 'Choose image',
                    'media.browse': 'Browse your media library or upload a new image.',
                    'media.title': 'Media',
                    'integrations.unsplash': 'Unsplash',
                    'unsplash.title': 'Unsplash',
                    'unsplash.placeholder': 'Search Unsplash',
                    'unsplash.size': 'Size',
                    'unsplash.size_small': 'Small',
                    'unsplash.size_large': 'Large',
                    'unsplash.start': 'Search to get started',
                }),
            })
        );

        render(
            <CanvasContext.Provider value={value}>
                <ImageSourcePicker open onClose={() => undefined} onSelect={() => undefined} />
            </CanvasContext.Provider>
        );

        expect(document.querySelector('[data-image-source-picker="true"]')).not.toBeNull();
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('exposes a close button on MediaPicker', () => {
        loadTranslations(
            JSON.stringify({
                'common.close': 'Close',
                'editor.choose_image': 'Choose image',
                'media.browse': 'Browse your media library or upload a new image.',
            })
        );

        const value = makeCanvasValue(
            makeBoot({
                translations: JSON.stringify({
                    'common.close': 'Close',
                    'editor.choose_image': 'Choose image',
                    'media.browse': 'Browse your media library or upload a new image.',
                    'media.title': 'Media',
                }),
            })
        );

        render(
            <CanvasContext.Provider value={value}>
                <MediaPicker open onClose={() => undefined} onSelect={() => undefined} />
            </CanvasContext.Provider>
        );

        expect(document.querySelector('[data-media-picker="true"]')).not.toBeNull();
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });
});
