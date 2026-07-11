import { PlusIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { EmptyState } from '@/components/EmptyState';
import { EmptyStateReveal } from '@/components/EmptyStateReveal';
import { Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { PageHeader } from '@/components/PageHeader';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import {
    Pagination,
    PaginationGap,
    PaginationList,
    PaginationNext,
    PaginationPage,
    PaginationPrevious,
} from '@/components/pagination';
import { Select } from '@/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table';
import { TableListSkeleton } from '@/components/TableListSkeleton';
import { TagsEmptyVisual } from '@/components/tags/TagsEmptyVisual';
import { TaxonomyDetailDrawer } from '@/components/taxonomy/TaxonomyDetailDrawer';
import { TopicsEmptyVisual } from '@/components/topics/TopicsEmptyVisual';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { isInitialLoading, isRefreshing, shouldShowEmpty } from '@/lib/async-ui';
import { tagsApi } from '@/lib/api/tags';
import { topicsApi } from '@/lib/api/topics';
import { paginationWindow, shouldGoToPreviousPageAfterDelete } from '@/lib/list-pagination';
import { toast } from '@/lib/toast';
import {
    formatTaxonomyDate,
    organizeIndexPath,
    parseOrganizeListFilters,
    setOrganizeTabParam,
    setTaxonomyDetailParam,
    taxonomyDetailId,
    taxonomyIndexQueryParams,
    taxonomyListHasActiveFilters,
    TAXONOMY_SEARCH_DEBOUNCE_MS,
    TAXONOMY_SORT_OPTIONS,
    type OrganizeListFilters,
    type OrganizeTab,
    type TaxonomyListSort,
} from '@/lib/taxonomy/list';
import type { Paginated, Tag, Topic } from '@/types/api';

type TaxonomyItem = Tag | Topic;

function updateOrganizeFilters(
    current: URLSearchParams,
    patch: Partial<Pick<OrganizeListFilters, 'page' | 'search' | 'sort'>>
): URLSearchParams {
    const next = new URLSearchParams(current);
    const currentFilters = parseOrganizeListFilters(current);

    const page = patch.page ?? 1;
    const search = patch.search !== undefined ? patch.search : currentFilters.search;
    const sort = patch.sort ?? currentFilters.sort;

    if (search.trim() !== '') {
        next.set('search', search.trim());
    } else {
        next.delete('search');
    }

    if (sort !== 'newest') {
        next.set('sort', sort);
    } else {
        next.delete('sort');
    }

    if (page > 1) {
        next.set('page', String(page));
    } else {
        next.delete('page');
    }

    return next;
}

const tabCopy = {
    topics: {
        singular: 'topic',
        newLabel: 'New topic',
        createLabel: 'Create a topic',
        creatingLabel: 'Creating…',
        emptyHeadline: 'No topics yet',
        emptyDescription:
            'Topics are the main categories on your blog. Create a few so authors can classify posts — one topic per post.',
        filteredEmpty: 'No topics match your search.',
        searchLabel: 'Search topics',
        loadError: 'Unable to load topics.',
        createError: 'Unable to create a new topic.',
        untitled: 'Untitled topic',
    },
    tags: {
        singular: 'tag',
        newLabel: 'New tag',
        createLabel: 'Create a tag',
        creatingLabel: 'Creating…',
        emptyHeadline: 'No tags yet',
        emptyDescription:
            'Create tags to group related posts. Authors can attach them while writing — many tags per post.',
        filteredEmpty: 'No tags match your search.',
        searchLabel: 'Search tags',
        loadError: 'Unable to load tags.',
        createError: 'Unable to create a new tag.',
        untitled: 'Untitled tag',
    },
} as const;

export default function OrganizeIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = parseOrganizeListFilters(searchParams);
    const detailId = taxonomyDetailId(searchParams);
    const tab = filters.tab;
    const copy = tabCopy[tab];

    const [searchDraft, setSearchDraft] = useState(filters.search);
    const [syncedSearch, setSyncedSearch] = useState(filters.search);
    const [response, setResponse] = useState<Paginated<TaxonomyItem> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [creatingId, setCreatingId] = useState<string | null>(null);

    if (filters.search !== syncedSearch) {
        setSyncedSearch(filters.search);
        setSearchDraft(filters.search);
    }

    useEffect(() => {
        const trimmed = searchDraft.trim();
        const current = filters.search.trim();

        if (trimmed === current) {
            return;
        }

        const timer = window.setTimeout(() => {
            setSearchParams((params) => updateOrganizeFilters(params, { search: searchDraft, page: 1 }), {
                replace: true,
            });
        }, TAXONOMY_SEARCH_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timer);
        };
    }, [searchDraft, filters.search, setSearchParams]);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        const api = tab === 'tags' ? tagsApi : topicsApi;

        queueMicrotask(() => {
            if (!cancelled) {
                setLoading(true);
                setError(null);
            }
        });

        api.index(
            taxonomyIndexQueryParams({
                page: filters.page,
                search: filters.search,
                sort: filters.sort,
            }),
            controller.signal
        )
            .then((data) => {
                if (!cancelled) {
                    setResponse(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(copy.loadError);
                    setResponse(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [filters.page, filters.search, filters.sort, tab, copy.loadError]);

    async function reloadList() {
        const api = tab === 'tags' ? tagsApi : topicsApi;
        const nextFilters = parseOrganizeListFilters(searchParams);

        try {
            const data = await api.index(taxonomyIndexQueryParams(nextFilters));
            setResponse(data);
            setError(null);
        } catch {
            setError(copy.loadError);
            setResponse(null);
        }
    }

    function openDetail(itemId: string) {
        setCreatingId(null);
        setSearchParams(setTaxonomyDetailParam(searchParams, itemId), { replace: false });
    }

    function closeDetail() {
        setCreatingId(null);
        setSearchParams(setTaxonomyDetailParam(searchParams, null), { replace: true });
    }

    function setTab(next: OrganizeTab) {
        setCreatingId(null);
        setSearchParams(setOrganizeTabParam(searchParams, next), { replace: false });
    }

    function setSort(sort: TaxonomyListSort) {
        setSearchParams(updateOrganizeFilters(searchParams, { sort, page: 1 }), { replace: true });
    }

    async function handleCreate() {
        setCreating(true);
        const api = tab === 'tags' ? tagsApi : topicsApi;

        try {
            const created = await api.create();
            setCreatingId(created.id);
            setSearchParams(setTaxonomyDetailParam(searchParams, created.id), { replace: false });
        } catch {
            toast.error(copy.createError);
        } finally {
            setCreating(false);
        }
    }

    async function handleDeleted(itemId: string) {
        setCreatingId(null);

        const remaining = response === null ? 0 : response.data.filter((item) => item.id !== itemId).length;

        setResponse((current) => {
            if (current === null) {
                return current;
            }

            return {
                ...current,
                data: current.data.filter((item) => item.id !== itemId),
            };
        });

        if (shouldGoToPreviousPageAfterDelete(remaining + 1, response?.current_page ?? 1) && filters.page > 1) {
            setSearchParams(
                updateOrganizeFilters(setTaxonomyDetailParam(searchParams, null), { page: filters.page - 1 }),
                {
                    replace: true,
                }
            );
            return;
        }

        await reloadList();
    }

    const itemCount = response?.data.length ?? 0;
    const showInitialSkeleton = isInitialLoading(loading, itemCount);
    const refreshing = isRefreshing(loading, itemCount);
    const isEmpty = shouldShowEmpty(loading, itemCount);
    const hasFilters = taxonomyListHasActiveFilters(filters);
    const showTrueEmpty = isEmpty && !hasFilters;
    const showFilteredEmpty = isEmpty && hasFilters;
    const { animateEmpty, animateContent } = useAsyncReveal(
        loading,
        itemCount,
        `${tab}:${filters.search}:${filters.sort}`
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Organize"
                actions={
                    <Button type="button" color="dark/zinc" disabled={creating} onClick={() => void handleCreate()}>
                        <PlusIcon data-slot="icon" />
                        {creating ? copy.creatingLabel : copy.newLabel}
                    </Button>
                }
            >
                <PageDescription>
                    Topics classify posts; tags label them. Authors pick these while writing.
                </PageDescription>
            </PageHeader>

            <PillNav value={tab} onChange={setTab} aria-label="Taxonomy type">
                <PillNavItem value="topics">Topics</PillNavItem>
                <PillNavItem value="tags">Tags</PillNavItem>
            </PillNav>

            <div className="flex flex-wrap items-end gap-3">
                <Field className="min-w-[12rem] flex-1 sm:max-w-xs">
                    <Label className="sr-only">{copy.searchLabel}</Label>
                    <Input
                        type="search"
                        name="taxonomy-search"
                        value={searchDraft}
                        placeholder="Search by name"
                        onChange={(event) => setSearchDraft(event.target.value)}
                    />
                </Field>
                <Field className="w-full sm:w-44">
                    <Label className="sr-only">Sort</Label>
                    <Select
                        name="taxonomy-sort"
                        value={filters.sort}
                        onChange={(event) => setSort(event.target.value as TaxonomyListSort)}
                    >
                        {TAXONOMY_SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </Field>
            </div>

            {error ? <ErrorText>{error}</ErrorText> : null}

            {showInitialSkeleton ? (
                <TableListSkeleton rows={6} columns={3} />
            ) : showTrueEmpty ? (
                <EmptyStateReveal animate={animateEmpty}>
                    <EmptyState
                        headline={copy.emptyHeadline}
                        description={copy.emptyDescription}
                        visual={tab === 'tags' ? <TagsEmptyVisual /> : <TopicsEmptyVisual />}
                        action={
                            <Button
                                type="button"
                                color="dark/zinc"
                                disabled={creating}
                                onClick={() => void handleCreate()}
                            >
                                <PlusIcon data-slot="icon" />
                                {creating ? copy.creatingLabel : copy.createLabel}
                            </Button>
                        }
                    />
                </EmptyStateReveal>
            ) : showFilteredEmpty ? (
                <EmptyStateReveal animate={animateEmpty}>
                    <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">{copy.filteredEmpty}</Text>
                </EmptyStateReveal>
            ) : response ? (
                <ContentReveal busy={refreshing} animate={animateContent}>
                    <Table striped className="[--gutter:--spacing(4)]">
                        <TableHead>
                            <TableRow>
                                <TableHeader>Name</TableHeader>
                                <TableHeader>Posts</TableHeader>
                                <TableHeader>Created</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {response.data.map((item) => {
                                const name = item.name.trim() === '' ? copy.untitled : item.name;
                                const selected = detailId === item.id;

                                return (
                                    <TableRow
                                        key={item.id}
                                        className={
                                            selected
                                                ? 'cursor-pointer bg-zinc-950/5 dark:bg-white/5'
                                                : 'cursor-pointer hover:bg-zinc-950/5 dark:hover:bg-white/5'
                                        }
                                        tabIndex={0}
                                        aria-label={`Edit ${name}`}
                                        data-selected={selected ? 'true' : undefined}
                                        onClick={() => openDetail(item.id)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                openDetail(item.id);
                                            }
                                        }}
                                    >
                                        <TableCell>
                                            <span className="font-medium text-zinc-950 dark:text-white">{name}</span>
                                        </TableCell>
                                        <TableCell className="text-canvas-muted dark:text-canvas-muted-dark">
                                            {(item.posts_count ?? 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-canvas-muted dark:text-canvas-muted-dark">
                                            {formatTaxonomyDate(item.created_at)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {response.last_page > 1 ? (
                        <Pagination className="mt-8">
                            <PaginationPrevious
                                href={
                                    response.current_page > 1
                                        ? organizeIndexPath({
                                              tab,
                                              page: response.current_page - 1,
                                              search: filters.search,
                                              sort: filters.sort,
                                          })
                                        : null
                                }
                            />
                            <PaginationList>
                                {paginationWindow(response.current_page, response.last_page).map((item, index) =>
                                    item === 'gap' ? (
                                        <PaginationGap key={`gap-${index}`} />
                                    ) : (
                                        <PaginationPage
                                            key={item}
                                            href={organizeIndexPath({
                                                tab,
                                                page: item,
                                                search: filters.search,
                                                sort: filters.sort,
                                            })}
                                            current={item === response.current_page}
                                        >
                                            {item}
                                        </PaginationPage>
                                    )
                                )}
                            </PaginationList>
                            <PaginationNext
                                href={
                                    response.current_page < response.last_page
                                        ? organizeIndexPath({
                                              tab,
                                              page: response.current_page + 1,
                                              search: filters.search,
                                              sort: filters.sort,
                                          })
                                        : null
                                }
                            />
                        </Pagination>
                    ) : null}
                </ContentReveal>
            ) : null}

            <TaxonomyDetailDrawer
                kind={tab === 'tags' ? 'tag' : 'topic'}
                open={detailId !== null}
                itemId={detailId}
                isNew={detailId !== null && detailId === creatingId}
                onClose={closeDetail}
                onSaved={(saved) => {
                    setCreatingId(null);
                    setResponse((current) => {
                        if (current === null) {
                            void reloadList();
                            return current;
                        }

                        const exists = current.data.some((item) => item.id === saved.id);

                        return {
                            ...current,
                            data: exists
                                ? current.data.map((item) => (item.id === saved.id ? { ...item, ...saved } : item))
                                : [{ ...saved, posts_count: 0 }, ...current.data],
                        };
                    });
                }}
                onDeleted={(itemId) => {
                    void handleDeleted(itemId);
                }}
            />
        </div>
    );
}
