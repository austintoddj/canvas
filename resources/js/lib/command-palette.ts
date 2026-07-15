import { type SearchResult, searchResultPath } from '@/types/api';

export type SearchEntityType = SearchResult['type'];

export type SearchPermissionOptions = {
    canManageTaxonomy: boolean;
    canManageUsers: boolean;
    canManageSettings?: boolean;
};

export type ParsedSearchQuery =
    { mode: 'help' } | { mode: 'search'; entityType: SearchEntityType | null; term: string };

export type NavigationPage = {
    id: string;
    label: string;
    path: string;
    keywords: string[];
    requires?: 'taxonomy' | 'users' | 'settings';
};

const ENTITY_PREFIXES: Record<string, SearchEntityType> = {
    '#': 'Tag',
    '@': 'User',
    '>': 'Topic',
};

/** App sections available from the command palette (mirrors sidebar + common destinations). */
export const NAVIGATION_PAGES: NavigationPage[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        keywords: ['home', 'stats', 'overview'],
    },
    {
        id: 'posts',
        label: 'Posts',
        path: '/posts',
        keywords: ['articles', 'writing', 'blog'],
    },
    {
        id: 'new-post',
        label: 'New post',
        path: '/posts/new',
        keywords: ['create', 'write', 'compose'],
    },
    {
        id: 'media',
        label: 'Media',
        path: '/media',
        keywords: ['images', 'photos', 'library', 'uploads'],
    },
    {
        id: 'organize',
        label: 'Organize',
        path: '/organize',
        keywords: ['taxonomy'],
        requires: 'taxonomy',
    },
    {
        id: 'tags',
        label: 'Tags',
        path: '/organize?tab=tags',
        keywords: ['label', 'labels'],
        requires: 'taxonomy',
    },
    {
        id: 'topics',
        label: 'Topics',
        path: '/organize?tab=topics',
        keywords: ['categories', 'category'],
        requires: 'taxonomy',
    },
    {
        id: 'users',
        label: 'Users',
        path: '/settings/users',
        keywords: ['authors', 'people', 'team', 'access'],
        requires: 'users',
    },
    {
        id: 'integrations',
        label: 'Integrations',
        path: '/settings/integrations',
        keywords: ['settings', 'unsplash', 'api', 'connections', 'ai', 'grok', 'openai', 'claude', 'chatgpt'],
        requires: 'settings',
    },
];

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

export function searchFilterHints(options: SearchPermissionOptions): SearchFilterHint[] {
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

export function canSearchEntityType(entityType: SearchEntityType, options: SearchPermissionOptions): boolean {
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
    options: SearchPermissionOptions
): SearchResult[] {
    return results.filter((result) => canSearchEntityType(result.type, options));
}

export function canAccessNavigationPage(page: NavigationPage, options: SearchPermissionOptions): boolean {
    switch (page.requires) {
        case 'taxonomy':
            return options.canManageTaxonomy;
        case 'users':
            return options.canManageUsers;
        case 'settings':
            return options.canManageSettings ?? false;
        default:
            return true;
    }
}

export function filterNavigationPages(
    term: string,
    options: SearchPermissionOptions,
    pages: NavigationPage[] = NAVIGATION_PAGES
): NavigationPage[] {
    const allowed = pages.filter((page) => canAccessNavigationPage(page, options));
    const normalized = term.trim().toLowerCase();

    if (normalized === '') {
        return allowed;
    }

    return allowed.filter((page) => {
        if (page.label.toLowerCase().includes(normalized)) {
            return true;
        }

        return page.keywords.some((keyword) => keyword.toLowerCase().includes(normalized));
    });
}

export type PaletteItem = { kind: 'page'; page: NavigationPage } | { kind: 'entity'; result: SearchResult };

export function paletteItemKey(item: PaletteItem): string {
    return item.kind === 'page' ? `page-${item.page.id}` : `entity-${item.result.type}-${item.result.id}`;
}

export function paletteItemLabel(item: PaletteItem): string {
    if (item.kind === 'page') {
        return item.page.label;
    }

    return item.result.type === 'Post' ? item.result.title : item.result.name;
}

export function paletteItemPath(item: PaletteItem): string {
    return item.kind === 'page' ? item.page.path : searchResultPath(item.result);
}
