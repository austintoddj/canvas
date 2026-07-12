// @vitest-environment happy-dom

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
    resolveMediaUrl,
} from '@/lib/media/list';

describe('media list helpers', () => {
    it('parses filters, paths, and search commit behavior', () => {
        expect(parseMediaListFilters(new URLSearchParams())).toEqual({
            scope: 'user',
            search: '',
            mime: '',
            sort: 'newest',
            page: 1,
        });
        expect(
            parseMediaListFilters(new URLSearchParams('scope=all&search=hero&mime=image/png&sort=oldest&page=2'))
        ).toEqual({
            scope: 'all',
            search: 'hero',
            mime: 'image/png',
            sort: 'oldest',
            page: 2,
        });
        expect(parseMediaListFilters(new URLSearchParams('mime=application/pdf')).mime).toBe('');
        expect(parseMediaListFilters(new URLSearchParams('sort=popular')).sort).toBe('newest');

        expect(mediaIndexPath({ scope: 'user', search: '', mime: '', sort: 'newest', page: 1 })).toBe('/media');
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

        expect(mediaListHasActiveFilters({ search: '', mime: '' })).toBe(false);
        expect(mediaListHasActiveFilters({ search: 'hero', mime: '' })).toBe(true);
        expect(MEDIA_SEARCH_DEBOUNCE_MS).toBeGreaterThan(0);
        expect(nextCommittedMediaSearch('  hero  ', 'hero')).toBeNull();
        expect(nextCommittedMediaSearch('logo', 'hero')).toBe('logo');
        expect(nextCommittedMediaSearch('  ', 'hero')).toBe('');
    });

    it('formats media display values and filters allowed uploads', () => {
        expect(resolveMediaUrl('https://app.test/storage/canvas/images/a.jpg')).toBe(
            `${window.location.origin}/storage/canvas/images/a.jpg`
        );
        expect(resolveMediaUrl('https://cdn.example.com/x.jpg')).toBe('https://cdn.example.com/x.jpg');
        expect(mediaDisplayName({ original_name: 'Hero.jpg', filename: 'abc.jpg', alt: 'Hero' })).toBe('Hero.jpg');
        expect(mediaDisplayName({ original_name: null, filename: 'abc.jpg', alt: 'Hero' })).toBe('Hero');
        expect(formatMediaBytes(1_572_864)).toBe('1.5 MB');
        expect(formatMediaDimensions(1200, 800)).toBe('1200 × 800');
        expect(mediaMimeLabel('image/png')).toBe('PNG');

        const jpeg = new File([new Uint8Array(8)], 'a.jpg', { type: 'image/jpeg' });
        const pdf = new File([new Uint8Array(8)], 'a.pdf', { type: 'application/pdf' });
        expect(isAllowedMediaFile(jpeg)).toBe(true);
        expect(isAllowedMediaFile(pdf)).toBe(false);
        expect(mediaFilesFromList([jpeg, pdf])).toEqual([jpeg]);

        expect(MEDIA_EMPTY_STATE.cta.toLowerCase()).toContain('upload');
        expect(MEDIA_FILTERED_EMPTY_MESSAGE.toLowerCase()).toContain('match');
    });
});
