import * as Headless from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { DocumentTextIcon, RectangleStackIcon, TagIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRecentPosts } from '@/hooks/useRecentPosts';
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

export function CommandPalette({ open, onClose }: Props) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const { posts: recentPosts } = useRecentPosts(8);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced search — only fires for non-empty queries; derived render handles empty state
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.trim() === '') {
            return;
        }

        debounceRef.current = setTimeout(() => {
            api.get<SearchResult[]>(`/search?q=${encodeURIComponent(query.trim())}`)
                .then(setResults)
                .catch(() => setResults([]));
        }, 250);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    function handleSelect(result: SearchResult | null) {
        if (!result) return;
        navigate(searchResultPath(result));
        onClose();
    }

    const isEmpty = query.trim() === '';
    const recentPostResults: SearchResult[] = recentPosts.map((p) => ({
        id: p.id,
        title: p.title,
        type: 'Post',
        route: 'edit-post',
    }));

    const displayResults = isEmpty ? recentPostResults : results;

    const grouped = displayResults.reduce<Record<string, SearchResult[]>>((acc, result) => {
        const group = acc[result.type] ?? [];
        group.push(result);
        acc[result.type] = group;
        return acc;
    }, {});

    const hasResults = displayResults.length > 0;

    return (
        <Headless.Dialog open={open} onClose={onClose} className="relative z-50">
            <Headless.DialogBackdrop
                transition
                className="fixed inset-0 bg-zinc-950/25 transition duration-100 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in dark:bg-zinc-950/60"
            />

            <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 lg:p-20">
                <Headless.DialogPanel
                    transition
                    className="mx-auto max-w-xl transform overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-100 data-closed:scale-95 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in dark:bg-zinc-900 dark:ring-white/10"
                >
                    <Headless.Combobox<SearchResult | null>
                        onChange={handleSelect}
                        onClose={() => {
                            /* keep open while dialog is open */
                        }}
                    >
                        <div className="flex items-center border-b border-zinc-200 px-4 dark:border-zinc-700">
                            <MagnifyingGlassIcon className="size-5 shrink-0 text-zinc-400" />

                            <Headless.ComboboxInput
                                autoFocus
                                className="h-12 w-full border-0 bg-transparent pl-3 pr-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none sm:text-sm dark:text-white dark:placeholder:text-zinc-500"
                                placeholder="Search…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Escape' && onClose()}
                            />
                        </div>

                        {hasResults && (
                            <Headless.ComboboxOptions static className="max-h-80 scroll-py-2 overflow-y-auto py-2">
                                {isEmpty && (
                                    <p className="px-4 pb-1 pt-0.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide dark:text-zinc-500">
                                        Recent Posts
                                    </p>
                                )}
                                {!isEmpty &&
                                    Object.entries(grouped).map(([type, items]) => (
                                        <li key={type}>
                                            <p className="px-4 pb-1 pt-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide dark:text-zinc-500">
                                                {type}s
                                            </p>
                                            <ul>
                                                {items.map((item) => (
                                                    <ResultItem key={`${item.type}-${item.id}`} result={item} />
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                {isEmpty &&
                                    recentPostResults.map((item) => (
                                        <ResultItem key={`${item.type}-${item.id}`} result={item} />
                                    ))}
                            </Headless.ComboboxOptions>
                        )}

                        {!hasResults && query.trim() !== '' && (
                            <div className="px-6 py-14 text-center text-sm sm:px-14">
                                <p className="font-semibold text-zinc-900 dark:text-white">No results found</p>
                                <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                                    Nothing matched &ldquo;{query}&rdquo;. Try a different search term.
                                </p>
                            </div>
                        )}
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
                    'flex cursor-default select-none items-center gap-3 px-4 py-2.5',
                    focus
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                        : 'text-zinc-700 dark:text-zinc-300'
                )
            }
        >
            <Icon className="size-5 shrink-0 text-zinc-400" />
            <span className="flex-1 truncate text-sm">{searchResultLabel(result)}</span>
            {'type' in result && <span className="text-xs text-zinc-400 dark:text-zinc-500">{result.type}</span>}
        </Headless.ComboboxOption>
    );
}
