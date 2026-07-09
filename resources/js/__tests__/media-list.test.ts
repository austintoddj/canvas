import { describe, expect, it } from 'vitest';

import {
    formatMediaBytes,
    formatMediaDimensions,
    isAllowedMediaFile,
    MEDIA_EMPTY_STATE,
    MEDIA_FILTERED_EMPTY_MESSAGE,
    MEDIA_SEARCH_DEBOUNCE_MS,
    mediaDisplayName,
    mediaFilesFromList,
    mediaIndexPath,
    mediaIndexQueryParams,
    mediaListHasActiveFilters,
    mediaMimeLabel,
    nextCommittedMediaSearch,
    parseMediaListFilters,
} from '@/lib/media/list';

describe('parseMediaListFilters', () => {
    it('reads scope, search, mime, sort, and page from search params', () => {
        const params = new URLSearchParams('scope=all&search=hero&mime=image/png&sort=oldest&page=2');

        expect(parseMediaListFilters(params)).toEqual({
            scope: 'all',
            search: 'hero',
            mime: 'image/png',
            sort: 'oldest',
            page: 2,
        });
    });

    it('defaults to mine, empty search, all types, newest, page 1', () => {
        expect(parseMediaListFilters(new URLSearchParams())).toEqual({
            scope: 'user',
            search: '',
            mime: '',
            sort: 'newest',
            page: 1,
        });
    });

    it('ignores unsupported mime and sort values', () => {
        expect(parseMediaListFilters(new URLSearchParams('mime=application/pdf')).mime).toBe('');
        expect(parseMediaListFilters(new URLSearchParams('sort=popular')).sort).toBe('newest');
    });
});

describe('mediaIndexPath', () => {
    it('builds SPA paths for list filters', () => {
        expect(mediaIndexPath({ scope: 'user', search: '', mime: '', sort: 'newest', page: 1 })).toBe('/media');
        expect(mediaIndexPath({ scope: 'all', search: 'cover', mime: 'image/jpeg', sort: 'oldest', page: 3 })).toBe(
            '/media?scope=all&search=cover&mime=image%2Fjpeg&sort=oldest&page=3'
        );
    });
});

describe('mediaIndexQueryParams', () => {
    it('maps UI filters to API query params, omitting newest sort default', () => {
        expect(mediaIndexQueryParams({ scope: 'user', search: '', mime: '', sort: 'newest', page: 1 })).toEqual({});
        expect(
            mediaIndexQueryParams({
                scope: 'all',
                search: '  logo  ',
                mime: 'image/webp',
                sort: 'oldest',
                page: 2,
            })
        ).toEqual({
            scope: 'all',
            search: 'logo',
            mime: 'image/webp',
            sort: 'oldest',
            page: 2,
        });
    });
});

describe('mediaListHasActiveFilters', () => {
    it('treats search and mime as filters but not sort', () => {
        expect(mediaListHasActiveFilters({ search: '', mime: '' })).toBe(false);
        expect(mediaListHasActiveFilters({ search: 'hero', mime: '' })).toBe(true);
        expect(mediaListHasActiveFilters({ search: '', mime: 'image/png' })).toBe(true);
    });
});

describe('instant search helpers', () => {
    it('uses a finite debounce delay for draft → URL commit', () => {
        expect(MEDIA_SEARCH_DEBOUNCE_MS).toBeGreaterThan(0);
        expect(MEDIA_SEARCH_DEBOUNCE_MS).toBeLessThan(2000);
    });

    it('commits changed drafts and clears search when draft is empty', () => {
        expect(nextCommittedMediaSearch('  hero  ', 'hero')).toBeNull();
        expect(nextCommittedMediaSearch('logo', 'hero')).toBe('logo');
        expect(nextCommittedMediaSearch('  ', 'hero')).toBe('');
        expect(nextCommittedMediaSearch('', '')).toBeNull();
    });
});

describe('empty state copy', () => {
    it('provides unfiltered empty headline, blurb, and upload CTA distinct from filtered empty', () => {
        expect(MEDIA_EMPTY_STATE.headline.length).toBeGreaterThan(0);
        expect(MEDIA_EMPTY_STATE.blurb.length).toBeGreaterThan(20);
        expect(MEDIA_EMPTY_STATE.cta.toLowerCase()).toContain('upload');
        expect(MEDIA_FILTERED_EMPTY_MESSAGE.toLowerCase()).toContain('match');
        expect(MEDIA_EMPTY_STATE.headline).not.toBe(MEDIA_FILTERED_EMPTY_MESSAGE);
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
