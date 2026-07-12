import { describe, expect, it } from 'vitest';

import {
    canSearchEntityType,
    filterNavigationPages,
    filterSearchResultsByPermissions,
    parseSearchQuery,
    paletteItemPath,
    searchFilterHints,
} from '@/lib/command-palette';
import type { SearchResult } from '@/types/api';

describe('command palette helpers', () => {
    it('parses query prefixes and empty/help modes', () => {
        expect(parseSearchQuery('?')).toEqual({ mode: 'help' });
        expect(parseSearchQuery('#laravel')).toEqual({ mode: 'search', entityType: 'Tag', term: 'laravel' });
        expect(parseSearchQuery('@todd')).toEqual({ mode: 'search', entityType: 'User', term: 'todd' });
        expect(parseSearchQuery('>news')).toEqual({ mode: 'search', entityType: 'Topic', term: 'news' });
        expect(parseSearchQuery('hello')).toEqual({ mode: 'search', entityType: null, term: 'hello' });
        expect(parseSearchQuery('')).toEqual({ mode: 'search', entityType: null, term: '' });
    });

    it('gates search filters and results by permission', () => {
        const contributor = { canManageTaxonomy: false, canManageUsers: false };
        const admin = { canManageTaxonomy: true, canManageUsers: true };

        expect(searchFilterHints(admin)).toEqual([
            { prefix: '#', label: 'Tags', entityType: 'Tag' },
            { prefix: '>', label: 'Topics', entityType: 'Topic' },
            { prefix: '@', label: 'Users', entityType: 'User' },
        ]);
        expect(searchFilterHints(contributor)).toEqual([]);

        expect(canSearchEntityType('Post', contributor)).toBe(true);
        expect(canSearchEntityType('Tag', contributor)).toBe(false);
        expect(canSearchEntityType('User', admin)).toBe(true);

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

        expect(filterSearchResultsByPermissions(results, contributor)).toEqual([
            { id: '1', title: 'Hello', type: 'Post', route: 'edit-post' },
        ]);
    });

    it('filters navigation pages by permission and query', () => {
        const contributor = {
            canManageTaxonomy: false,
            canManageUsers: false,
            canManageSettings: false,
        };
        const admin = {
            canManageTaxonomy: true,
            canManageUsers: true,
            canManageSettings: true,
        };

        const contributorPages = filterNavigationPages('', contributor).map((page) => page.id);
        expect(contributorPages).toEqual(['dashboard', 'posts', 'new-post', 'media']);
        expect(contributorPages).not.toContain('users');
        expect(contributorPages).not.toContain('integrations');
        expect(contributorPages).not.toContain('tags');

        const adminIds = filterNavigationPages('', admin).map((page) => page.id);
        expect(adminIds).toContain('dashboard');
        expect(adminIds).toContain('tags');
        expect(adminIds).toContain('topics');
        expect(adminIds).toContain('users');
        expect(adminIds).toContain('integrations');

        expect(filterNavigationPages('dash', admin).map((page) => page.id)).toEqual(['dashboard']);
        expect(filterNavigationPages('integr', admin).map((page) => page.id)).toEqual(['integrations']);
        expect(filterNavigationPages('unsplash', admin).map((page) => page.id)).toEqual(['integrations']);
        expect(filterNavigationPages('authors', admin).map((page) => page.id)).toEqual(['users']);
        expect(filterNavigationPages('zzzz', admin)).toEqual([]);
    });

    it('resolves palette item paths for pages and entities', () => {
        expect(
            paletteItemPath({
                kind: 'page',
                page: {
                    id: 'integrations',
                    label: 'Integrations',
                    path: '/settings/integrations',
                    keywords: [],
                    requires: 'settings',
                },
            })
        ).toBe('/settings/integrations');

        expect(
            paletteItemPath({
                kind: 'entity',
                result: { id: 'post-1', title: 'Hello', type: 'Post', route: 'edit-post' },
            })
        ).toBe('/posts/post-1');
    });
});
