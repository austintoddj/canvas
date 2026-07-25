import { type SearchResult, searchResultPath } from '@/types/api';

export type SearchEntityType = SearchResult['type'];

export type SearchPermissionOptions = {
    canManageTaxonomy: boolean;
    canManageUsers: boolean;
    canManageIntegrations?: boolean;
};

export type ParsedSearchQuery =
    { mode: 'help' } | { mode: 'search'; entityType: SearchEntityType | null; term: string };

export type NavigationPage = {
    id: string;
    labelKey: string;
    path: string;
    keywords: string[];
    requires?: 'taxonomy' | 'users' | 'integrations';
    /** When true, shown in the empty-query palette. Search still finds every page. */
    defaultVisible?: boolean;
};

export type TranslateLabel = (key: string) => string;

const ENTITY_PREFIXES: Record<string, SearchEntityType> = {
    '#': 'Tag',
    '@': 'User',
    '>': 'Topic',
};

/** App sections available from the command palette (mirrors sidebar + common destinations). */
export const NAVIGATION_PAGES: NavigationPage[] = [
    {
        id: 'dashboard',
        labelKey: 'nav.dashboard',
        path: '/',
        keywords: ['home', 'stats', 'overview', 'dashboard'],
        defaultVisible: true,
    },
    {
        id: 'posts',
        labelKey: 'nav.posts',
        path: '/posts',
        keywords: ['articles', 'writing', 'blog', 'posts'],
        defaultVisible: true,
    },
    {
        id: 'new-post',
        labelKey: 'posts.new',
        path: '/posts/new',
        keywords: ['create', 'write', 'compose', 'new post'],
        defaultVisible: true,
    },
    {
        id: 'media',
        labelKey: 'nav.media',
        path: '/media',
        keywords: ['images', 'photos', 'library', 'uploads', 'media'],
        defaultVisible: true,
    },
    {
        id: 'organize',
        labelKey: 'nav.organize',
        path: '/organize',
        keywords: ['taxonomy', 'organize'],
        requires: 'taxonomy',
        defaultVisible: true,
    },
    {
        id: 'tags',
        labelKey: 'organize.tags',
        path: '/organize?tab=tags',
        keywords: ['label', 'labels', 'tags'],
        requires: 'taxonomy',
    },
    {
        id: 'topics',
        labelKey: 'organize.topics',
        path: '/organize?tab=topics',
        keywords: ['categories', 'category', 'topics'],
        requires: 'taxonomy',
    },
    {
        id: 'users',
        labelKey: 'nav.users',
        path: '/users',
        keywords: ['authors', 'people', 'team', 'access', 'users'],
        requires: 'users',
        defaultVisible: true,
    },
    {
        id: 'integrations',
        labelKey: 'nav.integrations',
        path: '/integrations',
        keywords: ['unsplash', 'api', 'connections', 'ai', 'grok', 'openai', 'claude', 'chatgpt', 'integrations'],
        requires: 'integrations',
        defaultVisible: true,
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

export function searchFilterHints(
    options: SearchPermissionOptions,
    translate: TranslateLabel = (key) => key
): SearchFilterHint[] {
    const hints: SearchFilterHint[] = [];

    if (options.canManageTaxonomy) {
        hints.push(
            { prefix: '#', label: translate('palette.tags'), entityType: 'Tag' },
            { prefix: '>', label: translate('palette.topics'), entityType: 'Topic' }
        );
    }

    if (options.canManageUsers) {
        hints.push({ prefix: '@', label: translate('palette.users'), entityType: 'User' });
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
        case 'integrations':
            return options.canManageIntegrations ?? false;
        default:
            return true;
    }
}

export function filterNavigationPages(
    term: string,
    options: SearchPermissionOptions,
    pages: NavigationPage[] = NAVIGATION_PAGES,
    resolveLabel: TranslateLabel = (key) => key
): NavigationPage[] {
    const allowed = pages.filter((page) => canAccessNavigationPage(page, options));
    const normalized = term.trim().toLowerCase();

    if (normalized === '') {
        return allowed.filter((page) => page.defaultVisible === true);
    }

    return allowed.filter((page) => {
        const label = resolveLabel(page.labelKey).toLowerCase();

        if (label.includes(normalized)) {
            return true;
        }

        return page.keywords.some((keyword) => keyword.toLowerCase().includes(normalized));
    });
}

export type PaletteItem = { kind: 'page'; page: NavigationPage } | { kind: 'entity'; result: SearchResult };

export function paletteItemKey(item: PaletteItem): string {
    return item.kind === 'page' ? `page-${item.page.id}` : `entity-${item.result.type}-${item.result.id}`;
}

export function paletteItemLabel(item: PaletteItem, translate: TranslateLabel = (key) => key): string {
    if (item.kind === 'page') {
        return translate(item.page.labelKey);
    }

    return item.result.type === 'Post' ? item.result.title : item.result.name;
}

export function paletteItemPath(item: PaletteItem): string {
    return item.kind === 'page' ? item.page.path : searchResultPath(item.result);
}
