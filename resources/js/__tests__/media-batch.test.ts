import { describe, expect, it, vi } from 'vitest';

import {
    appendMediaItems,
    destroyMediaItems,
    filtersAfterUpload,
    prependMediaItems,
    removeMediaItems,
    shouldRefillMediaListAfterDelete,
    summarizeMediaDestroys,
    summarizeMediaUploads,
    toggleSelectedId,
    uploadMediaFiles,
    type MediaDestroyResult,
    type MediaUploadResult,
} from '@/lib/media/batch';
import type { Media } from '@/types/api';

function media(id: string, name = `${id}.jpg`): Media {
    return {
        id,
        user_id: 1,
        path: `uploads/${name}`,
        filename: name,
        original_name: name,
        mime_type: 'image/jpeg',
        size: 100,
        width: 10,
        height: 10,
        alt: null,
        caption: null,
        url: `https://example.com/${name}`,
        type: 'image',
        created_at: '2026-01-01T00:00:00.000000Z',
        updated_at: '2026-01-01T00:00:00.000000Z',
    };
}

describe('media batch helpers', () => {
    it('uploads and deletes with continue-on-error and useful summaries', async () => {
        const a = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });
        const b = new File([new Uint8Array(4)], 'b.jpg', { type: 'image/jpeg' });
        const c = new File([new Uint8Array(4)], 'c.jpg', { type: 'image/jpeg' });

        const upload = vi.fn(async (file: File) => {
            if (file.name === 'b.jpg') {
                throw new Error('File is too large.');
            }

            return media(file.name);
        });

        expect(await uploadMediaFiles([a, b, c], upload)).toEqual([
            { status: 'success', file: a, media: media('a.jpg') },
            { status: 'error', file: b, message: 'File is too large.' },
            { status: 'success', file: c, media: media('c.jpg') },
        ]);

        const partial: MediaUploadResult[] = [
            { status: 'success', file: a, media: media('1') },
            { status: 'error', file: b, message: 'File is too large.' },
        ];
        expect(summarizeMediaUploads(partial)?.tone).toBe('warning');
        expect(summarizeMediaUploads([])).toBeNull();
        expect(summarizeMediaUploads([{ status: 'success', file: a, media: media('1') }])?.message).toBe(
            '1 image uploaded.'
        );

        const destroy = vi.fn(async (id: string) => {
            if (id === 'b') {
                throw new Error('Forbidden.');
            }
        });
        expect(await destroyMediaItems(['a', 'b', 'c'], destroy)).toEqual([
            { status: 'success', id: 'a' },
            { status: 'error', id: 'b', message: 'Forbidden.' },
            { status: 'success', id: 'c' },
        ]);

        const destroyPartial: MediaDestroyResult[] = [
            { status: 'success', id: '1' },
            { status: 'error', id: '2', message: 'Nope.' },
        ];
        expect(summarizeMediaDestroys(destroyPartial)?.message).toBe('1 deleted, 1 failed.');
        expect(summarizeMediaDestroys([])).toBeNull();
    });

    it('merges lists, selection, filters, and refill decisions', () => {
        expect(
            prependMediaItems([media('old'), media('keep')], [media('new'), media('keep')]).map((item) => item.id)
        ).toEqual(['new', 'keep', 'old']);
        expect(appendMediaItems([media('a'), media('b')], [media('b'), media('c')]).map((item) => item.id)).toEqual([
            'a',
            'b',
            'c',
        ]);
        expect(removeMediaItems([media('a'), media('b'), media('c')], ['b', 'c']).map((item) => item.id)).toEqual([
            'a',
        ]);
        expect(Array.from(toggleSelectedId(new Set(['a']), 'b'))).toEqual(['a', 'b']);
        expect(Array.from(toggleSelectedId(new Set(['a']), 'a'))).toEqual([]);
        expect(filtersAfterUpload({ scope: 'all', search: 'hero', mime: 'image/png' })).toEqual({
            scope: 'user',
            search: 'hero',
            mime: 'image/png',
        });
        expect(shouldRefillMediaListAfterDelete(0, 2)).toBe(true);
        expect(shouldRefillMediaListAfterDelete(1, 2)).toBe(false);
        expect(shouldRefillMediaListAfterDelete(0, 1)).toBe(false);
    });
});
