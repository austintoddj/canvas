import { describe, expect, it } from 'vitest';

import emptyStateSource from '@/components/EmptyState.tsx?raw';
import tagsEmptyVisualSource from '@/components/tags/TagsEmptyVisual.tsx?raw';
import topicsEmptyVisualSource from '@/components/topics/TopicsEmptyVisual.tsx?raw';
import sideDrawerSource from '@/components/SideDrawer.tsx?raw';
import taxonomyDrawerSource from '@/components/taxonomy/TaxonomyDetailDrawer.tsx?raw';
import layoutSource from '@/layouts/Layout.tsx?raw';
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
import organizeIndexSource from '@/pages/Organize/Index.tsx?raw';
import tagsEditorSource from '@/pages/Tags/Editor.tsx?raw';
import tagsIndexSource from '@/pages/Tags/Index.tsx?raw';
import topicsEditorSource from '@/pages/Topics/Editor.tsx?raw';
import topicsIndexSource from '@/pages/Topics/Index.tsx?raw';
import routerSource from '@/router.tsx?raw';

describe('parseTaxonomyListFilters', () => {
    it('reads page, search, and sort from search params', () => {
        expect(parseTaxonomyListFilters(new URLSearchParams('page=4&search=hello&sort=posts'))).toEqual({
            page: 4,
            search: 'hello',
            sort: 'posts',
        });
    });

    it('defaults to page 1, empty search, and newest sort', () => {
        expect(parseTaxonomyListFilters(new URLSearchParams())).toEqual({
            page: 1,
            search: '',
            sort: 'newest',
        });
    });

    it('clamps invalid pages to 1', () => {
        expect(parseTaxonomyListFilters(new URLSearchParams('page=0'))).toEqual({
            page: 1,
            search: '',
            sort: 'newest',
        });
        expect(parseTaxonomyListFilters(new URLSearchParams('page=nope'))).toEqual({
            page: 1,
            search: '',
            sort: 'newest',
        });
    });
});

describe('parseOrganizeListFilters', () => {
    it('defaults to topics tab and empty filters', () => {
        expect(parseOrganizeListFilters(new URLSearchParams())).toEqual({
            tab: 'topics',
            page: 1,
            search: '',
            sort: 'newest',
        });
    });

    it('reads tags tab, page, search, and sort', () => {
        expect(parseOrganizeListFilters(new URLSearchParams('tab=tags&page=2&search=x&sort=name'))).toEqual({
            tab: 'tags',
            page: 2,
            search: 'x',
            sort: 'name',
        });
    });
});

describe('organizeIndexPath', () => {
    it('omits defaults on the topics first page', () => {
        expect(organizeIndexPath()).toBe('/organize');
        expect(organizeIndexPath({ tab: 'topics', page: 1 })).toBe('/organize');
    });

    it('includes tab=tags and pagination', () => {
        expect(organizeIndexPath({ tab: 'tags' })).toBe('/organize?tab=tags');
        expect(organizeIndexPath({ tab: 'topics', page: 3 })).toBe('/organize?page=3');
        expect(organizeIndexPath({ tab: 'tags', page: 2, detail: 'abc' })).toBe('/organize?tab=tags&page=2&detail=abc');
    });
});

describe('tagsIndexPath / topicsIndexPath (BC → organize)', () => {
    it('maps legacy helpers onto organize URLs', () => {
        expect(tagsIndexPath({ page: 1 })).toBe('/organize?tab=tags');
        expect(topicsIndexPath()).toBe('/organize');
        expect(tagsIndexPath({ page: 3 })).toBe('/organize?tab=tags&page=3');
        expect(topicsIndexPath({ page: 2 })).toBe('/organize?page=2');
        expect(tagsDetailPath('id-1')).toBe('/organize?tab=tags&detail=id-1');
        expect(topicsDetailPath('id-2')).toBe('/organize?detail=id-2');
    });
});

describe('legacyTaxonomyRedirectPath', () => {
    it('preserves page and detail from legacy query strings', () => {
        expect(legacyTaxonomyRedirectPath('tags', new URLSearchParams('page=2&detail=x'))).toBe(
            '/organize?tab=tags&page=2&detail=x'
        );
        expect(legacyTaxonomyRedirectPath('topics', new URLSearchParams(), 't-1')).toBe('/organize?detail=t-1');
    });
});

describe('taxonomyIndexQueryParams', () => {
    it('maps UI filters to API params', () => {
        expect(taxonomyIndexQueryParams({ page: 1, search: '', sort: 'newest' })).toEqual({});
        expect(taxonomyIndexQueryParams({ page: 5, search: 'php', sort: 'posts' })).toEqual({
            page: 5,
            search: 'php',
            sort: 'posts',
        });
    });
});

describe('formatTaxonomyDate', () => {
    it('formats valid dates and falls back for empty values', () => {
        expect(formatTaxonomyDate(null)).toBe('—');
        expect(formatTaxonomyDate('')).toBe('—');
        expect(formatTaxonomyDate('not-a-date')).toBe('—');
        expect(formatTaxonomyDate('2026-03-15T12:00:00Z')).not.toBe('—');
    });
});

describe('taxonomy detail deep links', () => {
    it('reads and writes the detail query param like media', () => {
        expect(taxonomyDetailId(new URLSearchParams())).toBeNull();
        expect(taxonomyDetailId(new URLSearchParams('detail=abc'))).toBe('abc');
        expect(setTaxonomyDetailParam(new URLSearchParams('page=2'), 'tag-1').get('detail')).toBe('tag-1');
        expect(setTaxonomyDetailParam(new URLSearchParams('detail=x'), null).get('detail')).toBeNull();
    });

    it('switches tabs without carrying page or detail', () => {
        const next = setOrganizeTabParam(new URLSearchParams('tab=tags&page=3&detail=x'), 'topics');
        expect(next.get('tab')).toBeNull();
        expect(next.get('page')).toBeNull();
        expect(next.get('detail')).toBeNull();
    });
});

describe('organize page (shipped source)', () => {
    it('is the single taxonomy surface with pill tabs', () => {
        expect(routerSource).toContain("path: 'organize'");
        expect(routerSource).toContain('OrganizeIndex');
        expect(layoutSource).toContain('Organize');
        expect(layoutSource).toContain('href="/organize"');
        expect(layoutSource).not.toContain('href="/tags"');
        expect(layoutSource).not.toContain('href="/topics"');
        expect(organizeIndexSource).toContain('PillNav');
        expect(organizeIndexSource).toContain('Topics');
        expect(organizeIndexSource).toContain('Tags');
        expect(organizeIndexSource).toContain('TaxonomyDetailDrawer');
    });

    it('uses designed empty visuals and async reveal contract', () => {
        expect(organizeIndexSource).toContain('EmptyState');
        expect(organizeIndexSource).toContain('TagsEmptyVisual');
        expect(organizeIndexSource).toContain('TopicsEmptyVisual');
        expect(organizeIndexSource).toContain('EmptyStateReveal');
        expect(organizeIndexSource).toContain('ContentReveal');
        expect(organizeIndexSource).toContain('useAsyncReveal');
        expect(organizeIndexSource).toContain('animate={animateEmpty}');
        expect(organizeIndexSource).toContain('animate={animateContent}');
        expect(organizeIndexSource).toContain('TableListSkeleton');
        expect(organizeIndexSource).toContain('busy={refreshing}');
        expect(organizeIndexSource).toContain('TAXONOMY_SEARCH_DEBOUNCE_MS');
        expect(organizeIndexSource).toContain('TAXONOMY_SORT_OPTIONS');
        expect(organizeIndexSource).toContain('showFilteredEmpty');
        expect(organizeIndexSource).toContain('taxonomy-search');
        expect(tagsEmptyVisualSource).toContain('data-tags-empty-visual');
        expect(topicsEmptyVisualSource).toContain('data-topics-empty-visual');
        expect(emptyStateSource).toContain('data-empty-state');
    });

    it('edits from a list drawer and redirects legacy tag/topic routes', () => {
        expect(taxonomyDrawerSource).toContain('SideDrawer');
        expect(sideDrawerSource).toContain('data-side-drawer');
        expect(sideDrawerSource).toContain('data-closed:translate-x-full');
        expect(sideDrawerSource).toContain('duration-300 ease-in-out');
        expect(tagsIndexSource).toContain('legacyTaxonomyRedirectPath');
        expect(topicsIndexSource).toContain('legacyTaxonomyRedirectPath');
        expect(tagsIndexSource).toContain('Navigate');
        expect(topicsIndexSource).toContain('Navigate');
        expect(tagsEditorSource).toContain('legacyTaxonomyRedirectPath');
        expect(topicsEditorSource).toContain('legacyTaxonomyRedirectPath');
        expect(organizeIndexSource).not.toContain('window.confirm');
        expect(organizeIndexSource).not.toContain('EllipsisVerticalIcon');
        expect(organizeIndexSource).not.toContain('Dropdown');
    });

    it('uses clickable rows and does not refetch when opening the drawer', () => {
        expect(organizeIndexSource).toContain('onClick={() => openDetail(item.id)}');
        expect(organizeIndexSource).toContain('cursor-pointer');
        expect(organizeIndexSource).toContain('[filters.page, filters.search, filters.sort, tab, copy.loadError]');
        expect(organizeIndexSource).toContain('creatingId');
        expect(organizeIndexSource).toContain('isNew={detailId !== null && detailId === creatingId}');
        expect(taxonomyDrawerSource).toContain('isNewProp');
        expect(taxonomyDrawerSource).toContain('preventScroll');
    });
});
