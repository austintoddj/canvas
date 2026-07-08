import { describe, expect, it } from 'vitest';

import { parseSearchQuery, searchFilterHints } from '@/lib/command-palette';

describe('parseSearchQuery', () => {
    it('returns help mode for question mark', () => {
        expect(parseSearchQuery('?')).toEqual({ mode: 'help' });
    });

    it('parses tag prefix', () => {
        expect(parseSearchQuery('#laravel')).toEqual({
            mode: 'search',
            entityType: 'Tag',
            term: 'laravel',
        });
    });

    it('parses user prefix', () => {
        expect(parseSearchQuery('@todd')).toEqual({
            mode: 'search',
            entityType: 'User',
            term: 'todd',
        });
    });

    it('parses topic prefix', () => {
        expect(parseSearchQuery('>news')).toEqual({
            mode: 'search',
            entityType: 'Topic',
            term: 'news',
        });
    });

    it('searches all types for plain text', () => {
        expect(parseSearchQuery('hello')).toEqual({
            mode: 'search',
            entityType: null,
            term: 'hello',
        });
    });

    it('shows recent posts for empty query', () => {
        expect(parseSearchQuery('')).toEqual({
            mode: 'search',
            entityType: null,
            term: '',
        });
    });
});

describe('searchFilterHints', () => {
    it('returns taxonomy and user hints for admins', () => {
        expect(
            searchFilterHints({
                canManageTaxonomy: true,
                canManageUsers: true,
            })
        ).toEqual([
            { prefix: '#', label: 'Tags', entityType: 'Tag' },
            { prefix: '>', label: 'Topics', entityType: 'Topic' },
            { prefix: '@', label: 'Users', entityType: 'User' },
        ]);
    });

    it('returns no hints for contributors', () => {
        expect(
            searchFilterHints({
                canManageTaxonomy: false,
                canManageUsers: false,
            })
        ).toEqual([]);
    });
});
