import { describe, expect, it } from 'vitest';

import {
    formatTaxonomyDate,
    legacyTaxonomyRedirectPath,
    organizeIndexPath,
    parseOrganizeListFilters,
    parseTaxonomyListFilters,
    setOrganizeTabParam,
    setTaxonomyDetailParam,
    tagsDetailPath,
    tagsIndexPath,
    taxonomyDetailId,
    taxonomyIndexQueryParams,
    topicsDetailPath,
    topicsIndexPath,
} from '@/lib/taxonomy/list';

describe('taxonomy list helpers', () => {
    it('parses filters, paths, deep links, and legacy organize redirects', () => {
        expect(parseTaxonomyListFilters(new URLSearchParams())).toEqual({
            page: 1,
            search: '',
            sort: 'newest',
        });
        expect(parseTaxonomyListFilters(new URLSearchParams('page=4&search=hello&sort=posts'))).toEqual({
            page: 4,
            search: 'hello',
            sort: 'posts',
        });
        expect(parseTaxonomyListFilters(new URLSearchParams('page=0')).page).toBe(1);

        expect(parseOrganizeListFilters(new URLSearchParams())).toEqual({
            tab: 'topics',
            page: 1,
            search: '',
            sort: 'newest',
        });
        expect(parseOrganizeListFilters(new URLSearchParams('tab=tags&page=2&search=x&sort=name'))).toEqual({
            tab: 'tags',
            page: 2,
            search: 'x',
            sort: 'name',
        });

        expect(organizeIndexPath()).toBe('/organize');
        expect(organizeIndexPath({ tab: 'tags', page: 2, detail: 'abc' })).toBe('/organize?tab=tags&page=2&detail=abc');
        expect(tagsIndexPath({ page: 1 })).toBe('/organize?tab=tags');
        expect(topicsIndexPath()).toBe('/organize');
        expect(tagsDetailPath('id-1')).toBe('/organize?tab=tags&detail=id-1');
        expect(topicsDetailPath('id-2')).toBe('/organize?detail=id-2');
        expect(legacyTaxonomyRedirectPath('tags', new URLSearchParams('page=2&detail=x'))).toBe(
            '/organize?tab=tags&page=2&detail=x'
        );

        expect(taxonomyIndexQueryParams({ page: 1, search: '', sort: 'newest' })).toEqual({});
        expect(taxonomyIndexQueryParams({ page: 5, search: 'php', sort: 'posts' })).toEqual({
            page: 5,
            search: 'php',
            sort: 'posts',
        });

        expect(taxonomyDetailId(new URLSearchParams())).toBeNull();
        expect(taxonomyDetailId(new URLSearchParams('detail=abc'))).toBe('abc');
        expect(setTaxonomyDetailParam(new URLSearchParams('page=2'), 'tag-1').get('detail')).toBe('tag-1');
        expect(setTaxonomyDetailParam(new URLSearchParams('detail=x'), null).get('detail')).toBeNull();

        const nextTab = setOrganizeTabParam(new URLSearchParams('tab=tags&page=3&detail=x'), 'topics');
        expect(nextTab.get('tab')).toBeNull();
        expect(nextTab.get('page')).toBeNull();
        expect(nextTab.get('detail')).toBeNull();

        expect(formatTaxonomyDate(null)).toBe('—');
        expect(formatTaxonomyDate('not-a-date')).toBe('—');
        expect(formatTaxonomyDate('2026-03-15T12:00:00Z')).not.toBe('—');
    });
});
