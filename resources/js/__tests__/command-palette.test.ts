import { describe, expect, it } from 'vitest';

import {
    canSearchEntityType,
    filterSearchResultsByPermissions,
    parseSearchQuery,
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
});
