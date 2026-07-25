import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { EmptyState } from '@/components/EmptyState';
import { EmptyStateReveal } from '@/components/EmptyStateReveal';
import { Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { ListRowActionButton, ListRowEnd } from '@/components/ListRowEnd';
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
import { Table, TableBody, TableCell, TableRow } from '@/components/table';
import { TableListSkeleton } from '@/components/TableListSkeleton';
import { TagsEmptyVisual } from '@/components/tags/TagsEmptyVisual';
import { TaxonomyDetailDrawer } from '@/components/taxonomy/TaxonomyDetailDrawer';
import { TopicsEmptyVisual } from '@/components/topics/TopicsEmptyVisual';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMobilePageAction } from '@/hooks/useMobilePageAction';
import { isInitialLoading, isRefreshing, shouldShowEmpty } from '@/lib/async-ui';
import { tagsApi } from '@/lib/api/tags';
import { topicsApi } from '@/lib/api/topics';
import { formatListDate } from '@/lib/format-list-date';
import { paginationWindow, shouldGoToPreviousPageAfterDelete } from '@/lib/list-pagination';
import { toast } from '@/lib/toast';
import {
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
import { IconPlus, IconTrash } from '@tabler/icons-react';

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

type TabCopy = {
    newLabel: string;
    createLabel: string;
    creatingLabel: string;
    emptyHeadline: string;
    emptyDescription: string;
    filteredEmpty: string;
    searchLabel: string;
    loadError: string;
    createError: string;
    untitled: string;
    deleteTitle: string;
};

export default function OrganizeIndex() {
    const { t } = useCanvas();
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = parseOrganizeListFilters(searchParams);
    const detailId = taxonomyDetailId(searchParams);
    const tab = filters.tab;

    useDocumentTitle(t('organize.title'));

    const copy: TabCopy =
        tab === 'topics'
            ? {
                  newLabel: t('organize.new_topic'),
                  createLabel: t('organize.create_topic'),
                  creatingLabel: t('organize.creating'),
                  emptyHeadline: t('organize.empty_topics_headline'),
                  emptyDescription: t('organize.empty_topics_blurb'),
                  filteredEmpty: t('organize.filtered_topics'),
                  searchLabel: t('organize.search_topics'),
                  loadError: t('organize.load_topics_error'),
                  createError: t('organize.create_topic_error'),
                  untitled: t('organize.untitled_topic'),
                  deleteTitle: t('organize.delete_confirm_topic'),
              }
            : {
                  newLabel: t('organize.new_tag'),
                  createLabel: t('organize.create_tag'),
                  creatingLabel: t('organize.creating'),
                  emptyHeadline: t('organize.empty_tags_headline'),
                  emptyDescription: t('organize.empty_tags_blurb'),
                  filteredEmpty: t('organize.filtered_tags'),
                  searchLabel: t('organize.search_tags'),
                  loadError: t('organize.load_tags_error'),
                  createError: t('organize.create_tag_error'),
                  untitled: t('organize.untitled_tag'),
                  deleteTitle: t('organize.delete_confirm_tag'),
              };

    const [searchDraft, setSearchDraft] = useState(filters.search);
    const [syncedSearch, setSyncedSearch] = useState(filters.search);
    const [response, setResponse] = useState<Paginated<TaxonomyItem> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [creatingId, setCreatingId] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<TaxonomyItem | null>(null);
    const [deleting, setDeleting] = useState(false);

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

    function closeDeleteConfirm() {
        if (deleting) {
            return;
        }

        setPendingDelete(null);
    }

    async function confirmDelete() {
        if (pendingDelete === null || deleting) {
            return;
        }

        setDeleting(true);
        const itemId = pendingDelete.id;
        const api = tab === 'tags' ? tagsApi : topicsApi;

        try {
            await api.destroy(itemId);
            setPendingDelete(null);
            toast.success(tab === 'tags' ? t('taxonomy.tag_deleted') : t('taxonomy.topic_deleted'));

            if (detailId === itemId) {
                closeDetail();
            }

            await handleDeleted(itemId);
        } catch {
            toast.error(tab === 'tags' ? t('taxonomy.tag_delete_error') : t('taxonomy.topic_delete_error'));
        } finally {
            setDeleting(false);
        }
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
    /** Show through load; hide only when true empty owns the CTA. */
    const showCreateAction = !showTrueEmpty;
    useMobilePageAction({
        visible: showCreateAction,
        label: creating ? copy.creatingLabel : copy.newLabel,
        disabled: creating,
        onClick: () => {
            void handleCreate();
        },
    });

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('organize.title')}
                actions={
                    showCreateAction ? (
                        <Button type="button" outline disabled={creating} onClick={() => void handleCreate()}>
                            <IconPlus data-slot="icon" />
                            {creating ? copy.creatingLabel : copy.newLabel}
                        </Button>
                    ) : undefined
                }
            >
                <PageDescription>{t('organize.description')}</PageDescription>
            </PageHeader>

            <PillNav value={tab} onChange={setTab} aria-label={t('organize.title')}>
                <PillNavItem value="topics">{t('organize.topics')}</PillNavItem>
                <PillNavItem value="tags">{t('organize.tags')}</PillNavItem>
            </PillNav>

            <div className="flex flex-wrap items-end gap-3">
                <Field className="min-w-[12rem] flex-1 sm:max-w-xs">
                    <Label className="sr-only">{copy.searchLabel}</Label>
                    <Input
                        type="search"
                        name="taxonomy-search"
                        value={searchDraft}
                        placeholder={t('organize.search_placeholder')}
                        onChange={(event) => setSearchDraft(event.target.value)}
                    />
                </Field>
                <Field className="w-full sm:w-44">
                    <Label className="sr-only">{t('organize.sort_label')}</Label>
                    <Select
                        name="taxonomy-sort"
                        value={filters.sort}
                        onChange={(event) => setSort(event.target.value as TaxonomyListSort)}
                    >
                        {TAXONOMY_SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {t(option.labelKey)}
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
                                <IconPlus data-slot="icon" />
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
                    <Table striped>
                        <TableBody>
                            {response.data.map((item) => {
                                const name = item.name.trim() === '' ? copy.untitled : item.name;
                                const selected = detailId === item.id;
                                const postsCount = item.posts_count ?? 0;

                                return (
                                    <TableRow
                                        key={item.id}
                                        className={
                                            selected
                                                ? 'group/list-row cursor-pointer bg-zinc-950/5 dark:bg-white/5'
                                                : 'group/list-row cursor-pointer hover:bg-zinc-950/5 dark:hover:bg-white/5'
                                        }
                                        tabIndex={0}
                                        aria-label={t('common.edit_aria', { name })}
                                        data-selected={selected ? 'true' : undefined}
                                        onClick={() => openDetail(item.id)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                openDetail(item.id);
                                            }
                                        }}
                                    >
                                        <TableCell className="w-full max-w-0">
                                            <div className="min-w-0">
                                                <span className="block truncate font-medium text-zinc-950 dark:text-white">
                                                    {name}
                                                </span>
                                                <Text className="mt-0.5 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                                    {postsCount.toLocaleString()} {postsCount === 1 ? 'post' : 'posts'}
                                                </Text>
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-px whitespace-nowrap">
                                            <ListRowEnd date={formatListDate(item.created_at)}>
                                                <ListRowActionButton
                                                    label={`Delete ${name}`}
                                                    danger
                                                    onClick={() => setPendingDelete(item)}
                                                >
                                                    <IconTrash className="size-5" aria-hidden="true" />
                                                </ListRowActionButton>
                                            </ListRowEnd>
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

            <Alert open={pendingDelete !== null} onClose={closeDeleteConfirm} size="sm">
                <AlertTitle>{copy.deleteTitle}</AlertTitle>
                <AlertDescription>
                    {t('taxonomy.delete_confirm', {
                        name:
                            pendingDelete === null || pendingDelete.name.trim() === ''
                                ? copy.untitled
                                : pendingDelete.name.trim(),
                    })}
                </AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={deleting} onClick={closeDeleteConfirm}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="button" color="red" disabled={deleting} onClick={() => void confirmDelete()}>
                        {deleting ? t('common.deleting') : t('common.delete')}
                    </Button>
                </AlertActions>
            </Alert>
        </div>
    );
}
