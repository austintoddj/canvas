import * as Headless from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { DocumentTextIcon, RectangleStackIcon, TagIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Kbd, KbdGroup } from '@/components/kbd';
import { usePermissions } from '@/hooks/usePermissions';
import { useRecentPosts } from '@/hooks/useRecentPosts';
import {
    canSearchEntityType,
    entityTypeToApiParam,
    filterSearchResultsByPermissions,
    parseSearchQuery,
    searchFilterHints,
    type SearchEntityType,
} from '@/lib/command-palette';
import { api } from '@/lib/api';
import { type SearchResult, searchResultLabel, searchResultPath } from '@/types/api';

type Props = {
    open: boolean;
    onClose: () => void;
};

const TYPE_ICONS: Record<SearchResult['type'], React.ElementType> = {
    Post: DocumentTextIcon,
    Tag: TagIcon,
    Topic: RectangleStackIcon,
    User: UserCircleIcon,
};

const GROUP_LABELS: Record<SearchEntityType, string> = {
    Post: 'Posts',
    Tag: 'Tags',
    Topic: 'Topics',
    User: 'Users',
};

export function CommandPalette({ open, onClose }: Props) {
    const navigate = useNavigate();
    const permissions = usePermissions();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const { posts: recentPosts } = useRecentPosts(8);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const parsed = useMemo(() => parseSearchQuery(query), [query]);
    const permissionOptions = useMemo(
        () => ({
            canManageTaxonomy: permissions.canManageTaxonomy,
            canManageUsers: permissions.canManageUsers,
        }),
        [permissions.canManageTaxonomy, permissions.canManageUsers]
    );
    const filterHints = useMemo(() => searchFilterHints(permissionOptions), [permissionOptions]);
    const restrictedEntity =
        parsed.mode === 'search' &&
        parsed.entityType !== null &&
        !canSearchEntityType(parsed.entityType, permissionOptions);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (parsed.mode === 'help') {
            return;
        }

        const showRecentPosts = parsed.entityType === null && parsed.term === '';

        if (showRecentPosts) {
            return;
        }

        if (parsed.entityType !== null && !canSearchEntityType(parsed.entityType, permissionOptions)) {
            return;
        }

        debounceRef.current = setTimeout(() => {
            const params = new URLSearchParams();

            if (parsed.term !== '') {
                params.set('q', parsed.term);
            }

            if (parsed.entityType !== null) {
                params.set('type', entityTypeToApiParam(parsed.entityType));
            }

            const queryString = params.toString();

            api.get<SearchResult[]>(`/search${queryString === '' ? '' : `?${queryString}`}`)
                .then((items) => setResults(filterSearchResultsByPermissions(items, permissionOptions)))
                .catch(() => setResults([]));
        }, 250);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [parsed, permissionOptions]);

    function handleSelect(result: SearchResult | null) {
        if (!result) return;
        navigate(searchResultPath(result));
        onClose();
    }

    const recentPostResults: SearchResult[] = recentPosts.map((p) => ({
        id: p.id,
        title: p.title,
        type: 'Post',
        route: 'edit-post',
    }));

    const showRecentPosts = parsed.mode === 'search' && parsed.entityType === null && parsed.term === '';
    const displayResults = restrictedEntity ? [] : showRecentPosts ? recentPostResults : results;

    const grouped = displayResults.reduce<Record<string, SearchResult[]>>((acc, result) => {
        const group = acc[result.type] ?? [];
        group.push(result);
        acc[result.type] = group;
        return acc;
    }, {});

    const hasResults = displayResults.length > 0;
    const emptyStateLabel =
        parsed.mode === 'search' && parsed.entityType !== null ? GROUP_LABELS[parsed.entityType] : 'results';

    return (
        <Headless.Dialog open={open} onClose={onClose} className="relative z-50">
            <Headless.DialogBackdrop
                transition
                className="fixed inset-0 bg-zinc-950/25 transition duration-100 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in dark:bg-zinc-950/60"
            />

            <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 lg:p-20">
                <Headless.DialogPanel
                    transition
                    className="mx-auto max-w-xl transform overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-100 data-closed:scale-95 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in dark:bg-zinc-900 dark:shadow-black/50 dark:ring-white/10"
                >
                    <Headless.Combobox<SearchResult | null>
                        onChange={handleSelect}
                        onClose={() => {
                            /* keep open while dialog is open */
                        }}
                    >
                        <div className="flex items-center border-b border-zinc-200 px-4 dark:border-white/10">
                            <MagnifyingGlassIcon className="size-5 shrink-0 text-zinc-400" />

                            <Headless.ComboboxInput
                                autoFocus
                                className="h-12 w-full border-0 bg-transparent pl-3 pr-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none sm:text-sm dark:text-white dark:placeholder:text-zinc-500"
                                placeholder="Search posts, tags, topics, and users…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Escape' && onClose()}
                            />
                        </div>

                        {parsed.mode === 'help' && <HelpPanel filterHints={filterHints} />}

                        {parsed.mode === 'search' && hasResults && (
                            <Headless.ComboboxOptions static className="max-h-80 scroll-py-2 overflow-y-auto py-2">
                                {showRecentPosts && (
                                    <p className="px-4 pb-1 pt-0.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide dark:text-zinc-500">
                                        Recent Posts
                                    </p>
                                )}
                                {!showRecentPosts &&
                                    Object.entries(grouped).map(([type, items]) => (
                                        <li key={type}>
                                            <p className="px-4 pb-1 pt-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide dark:text-zinc-500">
                                                {GROUP_LABELS[type as SearchEntityType] ?? `${type}s`}
                                            </p>
                                            <ul>
                                                {items.map((item) => (
                                                    <ResultItem key={`${item.type}-${item.id}`} result={item} />
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                {showRecentPosts &&
                                    recentPostResults.map((item) => (
                                        <ResultItem key={`${item.type}-${item.id}`} result={item} />
                                    ))}
                            </Headless.ComboboxOptions>
                        )}

                        {parsed.mode === 'search' && restrictedEntity && (
                            <div className="px-6 py-14 text-center text-sm sm:px-14">
                                <p className="font-semibold text-zinc-900 dark:text-white">Unavailable</p>
                                <p className="mt-2 text-canvas-muted dark:text-canvas-muted-dark">
                                    Your role cannot search {emptyStateLabel.toLowerCase()}.
                                </p>
                            </div>
                        )}

                        {parsed.mode === 'search' && !restrictedEntity && !hasResults && parsed.term !== '' && (
                            <div className="px-6 py-14 text-center text-sm sm:px-14">
                                <p className="font-semibold text-zinc-900 dark:text-white">No results found</p>
                                <p className="mt-2 text-canvas-muted dark:text-canvas-muted-dark">
                                    Nothing matched &ldquo;{parsed.term}&rdquo;. Try a different search term.
                                </p>
                            </div>
                        )}

                        {parsed.mode === 'search' &&
                            !restrictedEntity &&
                            !hasResults &&
                            parsed.term === '' &&
                            parsed.entityType !== null && (
                                <div className="px-6 py-14 text-center text-sm sm:px-14">
                                    <p className="font-semibold text-zinc-900 dark:text-white">
                                        No {emptyStateLabel.toLowerCase()} yet
                                    </p>
                                    <p className="mt-2 text-canvas-muted dark:text-canvas-muted-dark">
                                        Create some {emptyStateLabel.toLowerCase()} to see them here.
                                    </p>
                                </div>
                            )}

                        <CommandPaletteFooter filterHints={filterHints} />
                    </Headless.Combobox>
                </Headless.DialogPanel>
            </div>
        </Headless.Dialog>
    );
}

function ResultItem({ result }: { result: SearchResult }) {
    const Icon = TYPE_ICONS[result.type];

    return (
        <Headless.ComboboxOption
            value={result}
            className={({ focus }) =>
                clsx(
                    'flex cursor-pointer select-none items-center gap-3 px-4 py-2.5 data-disabled:cursor-not-allowed',
                    focus
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white'
                        : 'text-zinc-700 dark:text-zinc-300'
                )
            }
        >
            <Icon className="size-5 shrink-0 text-zinc-400" />
            <span className="flex-1 truncate text-sm">{searchResultLabel(result)}</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{result.type}</span>
        </Headless.ComboboxOption>
    );
}

type FilterHint = ReturnType<typeof searchFilterHints>[number];

function HelpPanel({ filterHints }: { filterHints: FilterHint[] }) {
    return (
        <div className="border-b border-zinc-200 px-4 py-5 text-sm dark:border-white/10">
            <p className="font-medium text-zinc-900 dark:text-white">Search tips</p>
            <ul className="mt-3 space-y-2 text-zinc-600 dark:text-zinc-300">
                <li>
                    Type to search across posts
                    {filterHints.length > 0
                        ? `, ${filterHints.map((hint) => hint.label.toLowerCase()).join(', ')}`
                        : ''}
                    .
                </li>
                {filterHints.map((hint) => (
                    <li key={hint.entityType} className="flex items-center gap-2">
                        <span>
                            Start with <Kbd>{hint.prefix}</Kbd> to search {hint.label.toLowerCase()} only.
                        </span>
                    </li>
                ))}
                <li className="flex items-center gap-2">
                    Press <Kbd>?</Kbd> anytime to show this help.
                </li>
            </ul>
        </div>
    );
}

function CommandPaletteFooter({ filterHints }: { filterHints: FilterHint[] }) {
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
            {filterHints.length > 0 && (
                <span className="flex flex-wrap items-center gap-2">
                    {filterHints.map((hint) => (
                        <span key={hint.entityType} className="inline-flex items-center gap-1">
                            <Kbd>{hint.prefix}</Kbd>
                            {hint.label}
                        </span>
                    ))}
                </span>
            )}
            <span className="inline-flex items-center gap-1">
                <Kbd>?</Kbd>
                Help
            </span>
            <span className="ml-auto inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                    <KbdGroup keys={['↑', '↓']} />
                    Navigate
                </span>
                <span className="inline-flex items-center gap-1">
                    <Kbd>↵</Kbd>
                    Select
                </span>
                <span className="inline-flex items-center gap-1">
                    <Kbd>esc</Kbd>
                    Close
                </span>
            </span>
        </div>
    );
}
