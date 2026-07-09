import { describe, expect, it, vi } from 'vitest';

import {
    appendMediaItems,
    destroyMediaItems,
    filtersAfterUpload,
    prependMediaItems,
    removeMediaItems,
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

describe('uploadMediaFiles', () => {
    it('uploads every file and continues after a failure', async () => {
        const a = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });
        const b = new File([new Uint8Array(4)], 'b.jpg', { type: 'image/jpeg' });
        const c = new File([new Uint8Array(4)], 'c.jpg', { type: 'image/jpeg' });

        const upload = vi.fn(async (file: File) => {
            if (file.name === 'b.jpg') {
                throw new Error('File is too large.');
            }

            return media(file.name);
        });

        const results = await uploadMediaFiles([a, b, c], upload);

        expect(upload).toHaveBeenCalledTimes(3);
        expect(results).toEqual([
            { status: 'success', file: a, media: media('a.jpg') },
            { status: 'error', file: b, message: 'File is too large.' },
            { status: 'success', file: c, media: media('c.jpg') },
        ]);
    });
});

describe('summarizeMediaUploads', () => {
    it('summarizes full success, partial success, and total failure', () => {
        const a = new File([], 'a.jpg');
        const b = new File([], 'b.jpg');
        const c = new File([], 'c.jpg');

        const allOk: MediaUploadResult[] = [
            { status: 'success', file: a, media: media('1') },
            { status: 'success', file: b, media: media('2') },
        ];
        expect(summarizeMediaUploads(allOk)).toEqual({
            succeeded: [media('1'), media('2')],
            failed: [],
            message: '2 images uploaded.',
            tone: 'success',
        });

        const oneOk: MediaUploadResult[] = [{ status: 'success', file: a, media: media('1') }];
        expect(summarizeMediaUploads(oneOk)?.message).toBe('1 image uploaded.');

        const partial: MediaUploadResult[] = [
            { status: 'success', file: a, media: media('1') },
            { status: 'error', file: b, message: 'File is too large.' },
            { status: 'success', file: c, media: media('3') },
        ];
        const partialSummary = summarizeMediaUploads(partial);
        expect(partialSummary?.tone).toBe('warning');
        expect(partialSummary?.succeeded).toHaveLength(2);
        expect(partialSummary?.failed).toHaveLength(1);
        expect(partialSummary?.message).toContain('2 uploaded, 1 failed');
        expect(partialSummary?.message).toContain('b.jpg');

        const allBad: MediaUploadResult[] = [
            { status: 'error', file: a, message: 'Nope.' },
            { status: 'error', file: b, message: 'Also no.' },
        ];
        const badSummary = summarizeMediaUploads(allBad);
        expect(badSummary?.tone).toBe('error');
        expect(badSummary?.succeeded).toHaveLength(0);
        expect(badSummary?.message).toContain('Upload failed');
    });

    it('returns null for an empty result list', () => {
        expect(summarizeMediaUploads([])).toBeNull();
    });
});

describe('list merge helpers', () => {
    it('prepends uploads without duplicating ids', () => {
        const existing = [media('old'), media('keep')];
        const incoming = [media('new'), media('keep')];

        expect(prependMediaItems(existing, incoming).map((item) => item.id)).toEqual(['new', 'keep', 'old']);
    });

    it('appends pages without duplicating ids', () => {
        const existing = [media('a'), media('b')];
        const page = [media('b'), media('c')];

        expect(appendMediaItems(existing, page).map((item) => item.id)).toEqual(['a', 'b', 'c']);
        expect(appendMediaItems(existing, [])).toBe(existing);
    });
});

describe('filtersAfterUpload', () => {
    it('switches scope to mine and keeps search/mime', () => {
        expect(
            filtersAfterUpload({
                scope: 'all',
                search: 'hero',
                mime: 'image/png',
            })
        ).toEqual({
            scope: 'user',
            search: 'hero',
            mime: 'image/png',
        });

        expect(
            filtersAfterUpload({
                scope: 'user',
                search: '',
                mime: '',
            })
        ).toEqual({
            scope: 'user',
            search: '',
            mime: '',
        });
    });
});

describe('destroyMediaItems', () => {
    it('deletes every id and continues after a failure', async () => {
        const destroy = vi.fn(async (id: string) => {
            if (id === 'b') {
                throw new Error('Forbidden.');
            }
        });

        const results = await destroyMediaItems(['a', 'b', 'c'], destroy);

        expect(destroy).toHaveBeenCalledTimes(3);
        expect(results).toEqual([
            { status: 'success', id: 'a' },
            { status: 'error', id: 'b', message: 'Forbidden.' },
            { status: 'success', id: 'c' },
        ]);
    });
});

describe('summarizeMediaDestroys', () => {
    it('summarizes full success, partial success, and total failure', () => {
        const allOk: MediaDestroyResult[] = [
            { status: 'success', id: '1' },
            { status: 'success', id: '2' },
        ];
        expect(summarizeMediaDestroys(allOk)).toEqual({
            succeeded: ['1', '2'],
            failed: [],
            message: '2 images deleted.',
            tone: 'success',
        });

        expect(summarizeMediaDestroys([{ status: 'success', id: '1' }])?.message).toBe('1 image deleted.');

        const partial: MediaDestroyResult[] = [
            { status: 'success', id: '1' },
            { status: 'error', id: '2', message: 'Nope.' },
        ];
        expect(summarizeMediaDestroys(partial)?.tone).toBe('warning');
        expect(summarizeMediaDestroys(partial)?.message).toBe('1 deleted, 1 failed.');

        const allBad: MediaDestroyResult[] = [
            { status: 'error', id: '1', message: 'Nope.' },
            { status: 'error', id: '2', message: 'Also no.' },
        ];
        expect(summarizeMediaDestroys(allBad)?.tone).toBe('error');
        expect(summarizeMediaDestroys(allBad)?.message).toContain('Unable to delete');
    });

    it('returns null for an empty result list', () => {
        expect(summarizeMediaDestroys([])).toBeNull();
    });
});

describe('removeMediaItems and toggleSelectedId', () => {
    it('removes matching ids and toggles selection sets', () => {
        const existing = [media('a'), media('b'), media('c')];
        expect(removeMediaItems(existing, ['b', 'c']).map((item) => item.id)).toEqual(['a']);
        expect(removeMediaItems(existing, [])).toBe(existing);

        const selected = new Set(['a']);
        expect(Array.from(toggleSelectedId(selected, 'b'))).toEqual(['a', 'b']);
        expect(Array.from(toggleSelectedId(selected, 'a'))).toEqual([]);
    });
});
