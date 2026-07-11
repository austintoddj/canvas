import type { SearchResult } from '@/types/api';

export type SearchEntityType = SearchResult['type'];

export type ParsedSearchQuery =
    { mode: 'help' } | { mode: 'search'; entityType: SearchEntityType | null; term: string };

const ENTITY_PREFIXES: Record<string, SearchEntityType> = {
    '#': 'Tag',
    '@': 'User',
    '>': 'Topic',
};

export function parseSearchQuery(raw: string): ParsedSearchQuery {
    const trimmed = raw.trim();

    if (trimmed === '?') {
        return { mode: 'help' };
    }

    const prefix = trimmed.charAt(0);

    if (prefix in ENTITY_PREFIXES) {
        return {
            mode: 'search',
            entityType: ENTITY_PREFIXES[prefix],
            term: trimmed.slice(1).trim(),
        };
    }

    return {
        mode: 'search',
        entityType: null,
        term: trimmed,
    };
}

export function entityTypeToApiParam(type: SearchEntityType): string {
    return type.toLowerCase();
}

export type SearchFilterHint = {
    prefix: string;
    label: string;
    entityType: SearchEntityType;
};

export function searchFilterHints(options: {
    canManageTaxonomy: boolean;
    canManageUsers: boolean;
}): SearchFilterHint[] {
    const hints: SearchFilterHint[] = [];

    if (options.canManageTaxonomy) {
        hints.push(
            { prefix: '#', label: 'Tags', entityType: 'Tag' },
            { prefix: '>', label: 'Topics', entityType: 'Topic' }
        );
    }

    if (options.canManageUsers) {
        hints.push({ prefix: '@', label: 'Users', entityType: 'User' });
    }

    return hints;
}

export function canSearchEntityType(
    entityType: SearchEntityType,
    options: { canManageTaxonomy: boolean; canManageUsers: boolean }
): boolean {
    switch (entityType) {
        case 'Post':
            return true;
        case 'Tag':
        case 'Topic':
            return options.canManageTaxonomy;
        case 'User':
            return options.canManageUsers;
    }
}

export function filterSearchResultsByPermissions(
    results: SearchResult[],
    options: { canManageTaxonomy: boolean; canManageUsers: boolean }
): SearchResult[] {
    return results.filter((result) => canSearchEntityType(result.type, options));
}
