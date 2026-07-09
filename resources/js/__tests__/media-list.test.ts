import { describe, expect, it } from 'vitest';

import {
    formatMediaBytes,
    formatMediaDimensions,
    isAllowedMediaFile,
    mediaDisplayName,
    mediaFilesFromList,
    mediaIndexPath,
    mediaIndexQueryParams,
    mediaMimeLabel,
    parseMediaListFilters,
} from '@/lib/media/list';

describe('parseMediaListFilters', () => {
    it('reads scope, search, mime, and page from search params', () => {
        const params = new URLSearchParams('scope=all&search=hero&mime=image/png&page=2');

        expect(parseMediaListFilters(params)).toEqual({
            scope: 'all',
            search: 'hero',
            mime: 'image/png',
            page: 2,
        });
    });

    it('defaults to mine, empty search, all types, page 1', () => {
        expect(parseMediaListFilters(new URLSearchParams())).toEqual({
            scope: 'user',
            search: '',
            mime: '',
            page: 1,
        });
    });

    it('ignores unsupported mime values', () => {
        expect(parseMediaListFilters(new URLSearchParams('mime=application/pdf')).mime).toBe('');
    });
});

describe('mediaIndexPath', () => {
    it('builds SPA paths for list filters', () => {
        expect(mediaIndexPath({ scope: 'user', search: '', mime: '', page: 1 })).toBe('/media');
        expect(mediaIndexPath({ scope: 'all', search: 'cover', mime: 'image/jpeg', page: 3 })).toBe(
            '/media?scope=all&search=cover&mime=image%2Fjpeg&page=3'
        );
    });
});

describe('mediaIndexQueryParams', () => {
    it('maps UI filters to API query params', () => {
        expect(mediaIndexQueryParams({ scope: 'user', search: '', mime: '', page: 1 })).toEqual({});
        expect(mediaIndexQueryParams({ scope: 'all', search: '  logo  ', mime: 'image/webp', page: 2 })).toEqual({
            scope: 'all',
            search: 'logo',
            mime: 'image/webp',
            page: 2,
        });
    });
});

describe('mediaDisplayName', () => {
    it('prefers original name, then alt, then filename', () => {
        expect(mediaDisplayName({ original_name: 'Hero.jpg', filename: 'abc.jpg', alt: 'Hero' })).toBe('Hero.jpg');
        expect(mediaDisplayName({ original_name: null, filename: 'abc.jpg', alt: 'Hero' })).toBe('Hero');
        expect(mediaDisplayName({ original_name: '  ', filename: 'abc.jpg', alt: null })).toBe('abc.jpg');
    });
});

describe('format helpers', () => {
    it('formats bytes, dimensions, and mime labels', () => {
        expect(formatMediaBytes(512)).toBe('512 B');
        expect(formatMediaBytes(2048)).toBe('2 KB');
        expect(formatMediaBytes(1_572_864)).toBe('1.5 MB');
        expect(formatMediaDimensions(1200, 800)).toBe('1200 × 800');
        expect(formatMediaDimensions(null, 800)).toBe('—');
        expect(mediaMimeLabel('image/png')).toBe('PNG');
        expect(mediaMimeLabel('image/svg+xml')).toBe('SVG+XML');
    });
});

describe('media file filtering', () => {
    it('keeps only allowed image mime types', () => {
        const jpeg = new File([new Uint8Array(8)], 'a.jpg', { type: 'image/jpeg' });
        const pdf = new File([new Uint8Array(8)], 'a.pdf', { type: 'application/pdf' });

        expect(isAllowedMediaFile(jpeg)).toBe(true);
        expect(isAllowedMediaFile(pdf)).toBe(false);
        expect(mediaFilesFromList([jpeg, pdf])).toEqual([jpeg]);
    });
});
