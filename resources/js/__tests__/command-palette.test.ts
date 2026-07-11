import { describe, expect, it } from 'vitest';

import layoutSource from '@/layouts/Layout.tsx?raw';
import {
    canSearchEntityType,
    filterSearchResultsByPermissions,
    parseSearchQuery,
    searchFilterHints,
} from '@/lib/command-palette';
import type { SearchResult } from '@/types/api';

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

describe('canSearchEntityType', () => {
    it('allows posts for every role', () => {
        expect(
            canSearchEntityType('Post', {
                canManageTaxonomy: false,
                canManageUsers: false,
            })
        ).toBe(true);
    });

    it('gates taxonomy and users by permission', () => {
        const contributor = { canManageTaxonomy: false, canManageUsers: false };
        const admin = { canManageTaxonomy: true, canManageUsers: true };

        expect(canSearchEntityType('Tag', contributor)).toBe(false);
        expect(canSearchEntityType('Topic', contributor)).toBe(false);
        expect(canSearchEntityType('User', contributor)).toBe(false);
        expect(canSearchEntityType('Tag', admin)).toBe(true);
        expect(canSearchEntityType('User', admin)).toBe(true);
    });
});

describe('filterSearchResultsByPermissions', () => {
    it('drops entity types the role cannot manage', () => {
        const results: SearchResult[] = [
            { id: '1', title: 'Hello', type: 'Post', route: 'edit-post' },
            { id: '2', name: 'Laravel', type: 'Tag', route: 'edit-tag' },
            {
                id: 3,
                name: 'Admin',
                email: 'a@example.com',
                username: 'admin',
                avatar_url: '',
                type: 'User',
                route: 'edit-user',
            },
        ];

        expect(
            filterSearchResultsByPermissions(results, {
                canManageTaxonomy: false,
                canManageUsers: false,
            })
        ).toEqual([{ id: '1', title: 'Hello', type: 'Post', route: 'edit-post' }]);
    });
});

describe('command palette shell wiring', () => {
    it('mounts the palette from layout and hits /search', () => {
        expect(layoutSource).toContain('CommandPalette');
        expect(layoutSource).toContain('paletteOpen');
    });
});
