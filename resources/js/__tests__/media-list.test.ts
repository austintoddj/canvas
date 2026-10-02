import { describe, expect, it } from 'vitest';

import {
    formatMediaBytes,
    formatMediaDimensions,
    isAllowedMediaFile,
    MEDIA_EMPTY_STATE_KEYS,
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
    updateMediaListSearchParams,
} from '@/lib/media/list';

describe('media list helpers', () => {
    it('parses filters, paths, and search commit behavior', () => {
        expect(parseMediaListFilters(new URLSearchParams())).toEqual({
            scope: 'user',
            search: '',
            mime: '',
            sort: 'newest',
            page: 1,
            tag: null,
            untagged: false,
        });
        expect(
            parseMediaListFilters(new URLSearchParams('scope=all&search=hero&mime=image/png&sort=oldest&page=2'))
        ).toEqual({
            scope: 'all',
            search: 'hero',
            mime: 'image/png',
            sort: 'oldest',
            page: 2,
            tag: null,
            untagged: false,
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
        expect(
            mediaListHasActiveFilters({
                search: '',
                mime: '',
                tag: '3f2c8a10-1111-4111-8111-aaaaaaaaaaaa',
            })
        ).toBe(true);
        expect(mediaListHasActiveFilters({ search: '', mime: '', untagged: true })).toBe(true);
        expect(MEDIA_SEARCH_DEBOUNCE_MS).toBeGreaterThan(0);
        expect(nextCommittedMediaSearch('  hero  ', 'hero')).toBeNull();
        expect(nextCommittedMediaSearch('logo', 'hero')).toBe('logo');
        expect(nextCommittedMediaSearch('  ', 'hero')).toBe('');
    });

    it('formats media display values and filters allowed uploads', () => {
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

        expect(MEDIA_EMPTY_STATE_KEYS.cta).toBe('media.empty_cta');
        expect(MEDIA_FILTERED_EMPTY_MESSAGE.toLowerCase()).toContain('match');
    });

    it('parses mutually exclusive tag and untagged URL filters', () => {
        const tag = '3f2c8a10-1111-4111-8111-aaaaaaaaaaaa';

        expect(parseMediaListFilters(new URLSearchParams(`tag=${tag}`))).toMatchObject({
            tag,
            untagged: false,
        });
        expect(parseMediaListFilters(new URLSearchParams('untagged=1'))).toMatchObject({
            tag: null,
            untagged: true,
        });
        expect(parseMediaListFilters(new URLSearchParams(`tag=${tag}&untagged=1`))).toMatchObject({
            tag,
            untagged: false,
        });
        expect(parseMediaListFilters(new URLSearchParams('tag=not-a-uuid'))).toMatchObject({
            tag: null,
            untagged: false,
        });

        expect(
            mediaIndexQueryParams({
                scope: 'user',
                search: '',
                mime: '',
                sort: 'newest',
                page: 1,
                tag,
                untagged: true,
            })
        ).toEqual({ tag });
        expect(
            mediaIndexQueryParams({
                scope: 'user',
                search: '',
                mime: '',
                sort: 'newest',
                page: 1,
                untagged: true,
            })
        ).toEqual({ untagged: 1 });
        expect(
            mediaIndexQueryParams({
                scope: 'user',
                search: 'logo',
                mime: '',
                sort: 'newest',
                page: 1,
            })
        ).toEqual({ search: 'logo' });
    });

    it('keeps omitted tag filters and never drops detail', () => {
        const tag = '3f2c8a10-1111-4111-8111-aaaaaaaaaaaa';
        const current = new URLSearchParams(`tag=${tag}&detail=${tag}&search=hero`);

        expect(updateMediaListSearchParams(current, { mime: 'image/png' }).get('tag')).toBe(tag);
        expect(updateMediaListSearchParams(current, { mime: 'image/png' }).get('detail')).toBe(tag);
        expect(updateMediaListSearchParams(current, { tag }).get('untagged')).toBeNull();
        expect(updateMediaListSearchParams(current, { untagged: true }).get('tag')).toBeNull();
        expect(updateMediaListSearchParams(current, { untagged: true }).get('untagged')).toBe('1');
        expect(updateMediaListSearchParams(current, { tag: null, untagged: false }).get('tag')).toBeNull();
        expect(updateMediaListSearchParams(current, { tag: null, untagged: false }).get('untagged')).toBeNull();
        expect(updateMediaListSearchParams(current, { tag: null, untagged: false }).get('detail')).toBe(tag);
    });
});
