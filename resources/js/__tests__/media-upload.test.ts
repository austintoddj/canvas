// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    MediaUploadError,
    ALLOWED_MEDIA_MIME_TYPES,
    getMaxUploadBytes,
    mediaApi,
    uploadMedia,
    validateMediaFile,
} from '@/lib/api/media';
import type { Media } from '@/types/api';

function imageFile(name: string, type: string, sizeBytes: number): File {
    return new File([new Uint8Array(sizeBytes)], name, { type });
}

const uploadedMedia: Media = {
    id: 'media-uuid',
    user_id: 1,
    path: 'uploads/photo.jpg',
    filename: 'photo.jpg',
    original_name: 'photo.jpg',
    mime_type: 'image/jpeg',
    size: 1024,
    width: 800,
    height: 600,
    alt: null,
    caption: null,
    url: 'https://example.com/uploads/photo.jpg',
    type: 'image',
    created_at: '2026-01-01T00:00:00.000000Z',
    updated_at: '2026-01-01T00:00:00.000000Z',
};

describe('media upload', () => {
    beforeEach(() => {
        window.Canvas = { ...window.Canvas, maxUpload: 3_145_728 };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('validates mime/size and uploads through create then store', async () => {
        expect(getMaxUploadBytes()).toBe(3_145_728);

        for (const type of ALLOWED_MEDIA_MIME_TYPES) {
            expect(() => validateMediaFile(imageFile('photo', type, 100), 1024)).not.toThrow();
        }
        expect(() => validateMediaFile(imageFile('doc.pdf', 'application/pdf', 100), 1024)).toThrow(MediaUploadError);
        expect(() => validateMediaFile(imageFile('big.jpg', 'image/jpeg', 2048), 1024)).toThrow(/too large/i);

        const createSpy = vi.spyOn(mediaApi, 'create').mockResolvedValue({ id: 'media-uuid' });
        const storeSpy = vi.spyOn(mediaApi, 'store').mockResolvedValue(uploadedMedia);
        const controller = new AbortController();
        const file = imageFile('photo.jpg', 'image/jpeg', 512);

        expect(await uploadMedia(file, { alt: 'Hero' }, controller.signal)).toBe(uploadedMedia);
        expect(createSpy).toHaveBeenCalledWith(controller.signal);
        expect(storeSpy).toHaveBeenCalledWith('media-uuid', file, { alt: 'Hero' }, controller.signal);

        createSpy.mockClear();
        storeSpy.mockClear();
        await expect(uploadMedia(imageFile('bad.pdf', 'application/pdf', 100))).rejects.toThrow(MediaUploadError);
        expect(createSpy).not.toHaveBeenCalled();
        expect(storeSpy).not.toHaveBeenCalled();
    });
});
