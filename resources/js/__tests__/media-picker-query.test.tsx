// @vitest-environment happy-dom

import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MediaPickerPanel } from '@/components/media/MediaPicker';
import { makeBoot, withCanvas } from '@/__tests__/helpers/boot';

const indexMock = vi.fn();

vi.mock('@/lib/api/media', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/api/media')>();

    return {
        ...actual,
        mediaApi: {
            ...actual.mediaApi,
            index: (...args: unknown[]) => indexMock(...args),
        },
    };
});

describe('MediaPickerPanel index query', () => {
    it('requests only scope and search', async () => {
        indexMock.mockResolvedValue({
            data: [],
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 0,
        });

        render(
            withCanvas(
                <MediaPickerPanel onSelect={() => undefined} />,
                makeBoot({
                    translations: {
                        'media.search_label': 'Search media',
                        'media.search_placeholder': 'Search',
                        'media.load_error': 'Unable to load media.',
                        'media.empty_images': 'No images found.',
                    },
                })
            )
        );

        await waitFor(() => {
            expect(indexMock).toHaveBeenCalled();
        });

        const params = indexMock.mock.calls[0]?.[0] as Record<string, unknown>;

        expect(params).toEqual({});
        expect(params).not.toHaveProperty('tag');
        expect(params).not.toHaveProperty('untagged');
    });
});
