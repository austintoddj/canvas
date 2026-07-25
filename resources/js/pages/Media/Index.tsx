import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState, type DragEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { EmptyState } from '@/components/EmptyState';
import { EmptyStateReveal } from '@/components/EmptyStateReveal';
import { Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { MediaDetailDrawer } from '@/components/media/MediaDetailDrawer';
import { MediaEmptyVisual } from '@/components/media/MediaEmptyVisual';
import { MediaGrid } from '@/components/media/MediaGrid';
import { MediaGridSkeleton } from '@/components/media/MediaGridSkeleton';
import { PageHeader } from '@/components/PageHeader';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { Select } from '@/components/select';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMobilePageAction } from '@/hooks/useMobilePageAction';
import { usePermissions } from '@/hooks/usePermissions';
import { isInitialLoading, isRefreshing, shouldShowEmpty } from '@/lib/async-ui';
import { ALLOWED_MEDIA_MIME_TYPES, mediaApi, uploadMedia } from '@/lib/api/media';
import {
    appendMediaItems,
    destroyMediaItems,
    filtersAfterUpload,
    prependMediaItems,
    removeMediaItems,
    shouldRefillMediaListAfterDelete,
    summarizeMediaDestroys,
    summarizeMediaUploads,
    toggleSelectedId,
    uploadMediaFiles,
} from '@/lib/media/batch';
import { isFileDragTypes, reducePageDrag } from '@/lib/media/drag';
import {
    MEDIA_EMPTY_STATE_KEYS,
    MEDIA_MIME_FILTERS,
    MEDIA_SEARCH_DEBOUNCE_MS,
    MEDIA_SORT_OPTIONS,
    mediaFilesFromList,
    mediaIndexQueryParams,
    mediaListHasActiveFilters,
    nextCommittedMediaSearch,
    parseMediaListFilters,
    type MediaListFilters,
    type MediaListSort,
    type MediaMimeFilter,
} from '@/lib/media/list';
import { toast, toastFromTone } from '@/lib/toast';
import type { Media } from '@/types/api';
import { IconTrash, IconUpload } from '@tabler/icons-react';

const ACCEPT = ALLOWED_MEDIA_MIME_TYPES.join(',');

/** Library filters in the URL (page is client state for load-more). */
type MediaUrlFilters = Pick<MediaListFilters, 'scope' | 'search' | 'mime' | 'sort'>;

function updateFilters(current: URLSearchParams, patch: Partial<MediaUrlFilters>): URLSearchParams {
    const next = new URLSearchParams(current);
    const currentFilters = parseMediaListFilters(current);

    const scope = patch.scope ?? currentFilters.scope;
    const search = patch.search !== undefined ? patch.search : currentFilters.search;
    const mime = patch.mime !== undefined ? patch.mime : currentFilters.mime;
    const sort = patch.sort ?? currentFilters.sort;

    if (scope === 'all') {
        next.set('scope', 'all');
    } else {
        next.delete('scope');
    }

    if (search.trim() !== '') {
        next.set('search', search.trim());
    } else {
        next.delete('search');
    }

    if (mime !== '') {
        next.set('mime', mime);
    } else {
        next.delete('mime');
    }

    if (sort === 'oldest') {
        next.set('sort', 'oldest');
    } else {
        next.delete('sort');
    }

    // Load-more owns pagination in component state — drop legacy ?page=.
    next.delete('page');

    return next;
}

function setDetailParam(current: URLSearchParams, mediaId: string | null): URLSearchParams {
    const next = new URLSearchParams(current);

    if (mediaId === null || mediaId === '') {
        next.delete('detail');
    } else {
        next.set('detail', mediaId);
    }

    return next;
}

export default function MediaIndex() {
    const { t } = useCanvas();
    const { canViewAllMedia } = usePermissions();
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = parseMediaListFilters(searchParams);
    const detailId = searchParams.get('detail');
    const pageDragDepth = useRef(0);
    const browseInputRef = useRef<HTMLInputElement>(null);

    useDocumentTitle(t('media.title'));

    const [searchDraft, setSearchDraft] = useState(filters.search);
    const [syncedSearch, setSyncedSearch] = useState(filters.search);
    const [items, setItems] = useState<Media[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
    const [pageDragging, setPageDragging] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
    const libraryBodyRef = useRef<HTMLDivElement>(null);
    const [libraryBodyMinHeight, setLibraryBodyMinHeight] = useState<number | undefined>(undefined);

    if (filters.search !== syncedSearch) {
        setSyncedSearch(filters.search);
        setSearchDraft(filters.search);
    }

    useEffect(() => {
        const nextSearch = nextCommittedMediaSearch(searchDraft, filters.search);

        if (nextSearch === null) {
            return;
        }

        const timer = window.setTimeout(() => {
            setSearchParams((current) => updateFilters(current, { search: nextSearch }));
        }, MEDIA_SEARCH_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timer);
        };
    }, [searchDraft, filters.search, setSearchParams]);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        queueMicrotask(() => {
            if (!cancelled) {
                setLoading(true);
                setError(null);
                setPage(1);
                setLastPage(1);
                setSelectedIds(new Set());
                setConfirmBulkDeleteOpen(false);
            }
        });

        mediaApi
            .index(
                mediaIndexQueryParams({
                    scope: filters.scope,
                    search: filters.search,
                    mime: filters.mime,
                    sort: filters.sort,
                    page: 1,
                }),
                controller.signal
            )
            .then((data) => {
                if (!cancelled) {
                    setItems(data.data);
                    setPage(data.current_page);
                    setLastPage(data.last_page);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(t('media.load_error'));
                    setItems([]);
                    setPage(1);
                    setLastPage(1);
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
    }, [filters.scope, filters.search, filters.mime, filters.sort, t]);

    useEffect(() => {
        function clearPageDrag() {
            if (pageDragDepth.current === 0) {
                return;
            }

            const next = reducePageDrag({
                depth: pageDragDepth.current,
                kind: 'end',
                isFileDrag: true,
                uploading: false,
            });
            pageDragDepth.current = next.depth;
            setPageDragging(next.active);
        }

        window.addEventListener('dragend', clearPageDrag);
        window.addEventListener('blur', clearPageDrag);
        window.addEventListener('drop', clearPageDrag);

        return () => {
            window.removeEventListener('dragend', clearPageDrag);
            window.removeEventListener('blur', clearPageDrag);
            window.removeEventListener('drop', clearPageDrag);
        };
    }, []);

    function setFilters(patch: Partial<MediaUrlFilters>) {
        setSearchParams(updateFilters(searchParams, patch));
    }

    function openDetail(mediaId: string) {
        setSearchParams(setDetailParam(searchParams, mediaId), { replace: false });
    }

    function closeDetail() {
        setSearchParams(setDetailParam(searchParams, null), { replace: true });
    }

    function openBrowse() {
        if (uploading) {
            return;
        }

        browseInputRef.current?.click();
    }

    async function loadMore() {
        if (loadingMore || uploading || page >= lastPage) {
            return;
        }

        const nextPage = page + 1;
        setLoadingMore(true);
        setError(null);

        try {
            const data = await mediaApi.index(
                mediaIndexQueryParams({
                    scope: filters.scope,
                    search: filters.search,
                    mime: filters.mime,
                    sort: filters.sort,
                    page: nextPage,
                })
            );

            setItems((current) => appendMediaItems(current, data.data));
            setPage(data.current_page);
            setLastPage(data.last_page);
        } catch {
            setError(t('media.load_error'));
        } finally {
            setLoadingMore(false);
        }
    }

    async function refillFirstPage() {
        setLoading(true);
        setError(null);
        setPage(1);
        setSelectedIds(new Set());
        setConfirmBulkDeleteOpen(false);

        try {
            const data = await mediaApi.index(
                mediaIndexQueryParams({
                    scope: filters.scope,
                    search: filters.search,
                    mime: filters.mime,
                    sort: filters.sort,
                    page: 1,
                })
            );

            setItems(data.data);
            setPage(data.current_page);
            setLastPage(data.last_page);
        } catch {
            setError(t('media.load_error'));
            setItems([]);
            setPage(1);
            setLastPage(1);
        } finally {
            setLoading(false);
        }
    }

    function applyRemovedMedia(ids: Iterable<string>) {
        let remainingCount = 0;

        setItems((current) => {
            const next = removeMediaItems(current, ids);
            remainingCount = next.length;

            return next;
        });

        if (shouldRefillMediaListAfterDelete(remainingCount, lastPage)) {
            void refillFirstPage();
        }
    }

    async function handleFiles(files: File[]) {
        if (files.length === 0) {
            setError(null);
            toast.error(t('media.unsupported_type'));
            return;
        }

        setUploading(true);
        setError(null);
        setUploadProgress({ current: 1, total: files.length });

        let completed = 0;
        const results = await uploadMediaFiles(files, async (file) => {
            completed += 1;
            setUploadProgress({ current: completed, total: files.length });
            const media = await uploadMedia(file);
            return media;
        });

        const summary = summarizeMediaUploads(results);
        setUploadProgress(null);
        setUploading(false);

        if (summary === null) {
            return;
        }

        toastFromTone(summary.message, summary.tone);

        if (summary.succeeded.length === 0) {
            return;
        }

        setItems((current) => prependMediaItems(current, summary.succeeded));

        const nextFilters = filtersAfterUpload(filters);

        if (
            nextFilters.scope !== filters.scope ||
            nextFilters.search !== filters.search ||
            nextFilters.mime !== filters.mime
        ) {
            setSearchParams(updateFilters(searchParams, nextFilters));
        }
    }

    function openBulkDeleteConfirm() {
        if (selectedIds.size === 0 || bulkDeleting || uploading) {
            return;
        }

        setConfirmBulkDeleteOpen(true);
    }

    function closeBulkDeleteConfirm() {
        if (bulkDeleting) {
            return;
        }

        setConfirmBulkDeleteOpen(false);
    }

    async function confirmBulkDelete() {
        if (selectedIds.size === 0 || bulkDeleting) {
            return;
        }

        setBulkDeleting(true);
        setError(null);

        const ids = Array.from(selectedIds);
        const results = await destroyMediaItems(ids, async (id) => {
            await mediaApi.destroy(id);
        });
        const summary = summarizeMediaDestroys(results);

        setBulkDeleting(false);
        setConfirmBulkDeleteOpen(false);

        if (summary === null) {
            return;
        }

        toastFromTone(summary.message, summary.tone);
        applyRemovedMedia(summary.succeeded);
        setSelectedIds((current) => {
            const next = new Set(current);

            for (const id of summary.succeeded) {
                next.delete(id);
            }

            return next;
        });

        if (detailId !== null && summary.succeeded.includes(detailId)) {
            closeDetail();
        }
    }

    function handlePageDragEnter(event: DragEvent<HTMLDivElement>) {
        const next = reducePageDrag({
            depth: pageDragDepth.current,
            kind: 'enter',
            isFileDrag: isFileDragTypes(event.dataTransfer.types),
            uploading,
        });

        if (!next.accept) {
            return;
        }

        event.preventDefault();
        pageDragDepth.current = next.depth;
        setPageDragging(next.active);
    }

    function handlePageDragLeave(event: DragEvent<HTMLDivElement>) {
        const next = reducePageDrag({
            depth: pageDragDepth.current,
            kind: 'leave',
            isFileDrag: true,
            uploading,
        });

        if (pageDragDepth.current === 0) {
            return;
        }

        event.preventDefault();
        pageDragDepth.current = next.depth;
        setPageDragging(next.active);
    }

    function handlePageDragOver(event: DragEvent<HTMLDivElement>) {
        const next = reducePageDrag({
            depth: pageDragDepth.current,
            kind: 'over',
            isFileDrag: isFileDragTypes(event.dataTransfer.types),
            uploading,
        });

        if (!next.accept) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    function handlePageDrop(event: DragEvent<HTMLDivElement>) {
        const isFileDrag = isFileDragTypes(event.dataTransfer.types);
        const next = reducePageDrag({
            depth: pageDragDepth.current,
            kind: 'drop',
            isFileDrag,
            uploading,
        });

        if (!next.accept) {
            return;
        }

        event.preventDefault();
        pageDragDepth.current = next.depth;
        setPageDragging(next.active);

        if (!next.shouldUpload) {
            return;
        }

        void handleFiles(mediaFilesFromList(event.dataTransfer.files));
    }

    const hasFilters = mediaListHasActiveFilters(filters);
    const itemCount = items.length;
    const showInitialSkeleton = isInitialLoading(loading, itemCount);
    const refreshing = isRefreshing(loading, itemCount);
    const isEmpty = shouldShowEmpty(loading, itemCount);
    const { animateEmpty, animateContent } = useAsyncReveal(loading, itemCount);
    const showEmptyLibrary = isEmpty && !hasFilters;
    const showFilteredEmpty = isEmpty && hasFilters;
    const showFilledLibrary = itemCount > 0;
    const canLoadMore = showFilledLibrary && !loading && page < lastPage;
    const selectionCount = selectedIds.size;

    useLayoutEffect(() => {
        const node = libraryBodyRef.current;

        if (refreshing) {
            if (node !== null) {
                const height = node.offsetHeight;

                setLibraryBodyMinHeight((current) => current ?? height);
            }

            return;
        }

        if (libraryBodyMinHeight === undefined) {
            return;
        }

        const frame = window.requestAnimationFrame(() => {
            setLibraryBodyMinHeight(undefined);
        });

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, [refreshing, libraryBodyMinHeight, itemCount]);

    const uploadLabel =
        uploading && uploadProgress !== null
            ? t('media.uploading_progress', {
                  current: uploadProgress.current,
                  total: uploadProgress.total,
              })
            : uploading
              ? t('media.uploading')
              : null;
    /** Show through load; hide only when empty library owns the CTA. */
    const showUploadAction = !showEmptyLibrary;
    useMobilePageAction({
        visible: showUploadAction,
        label: uploadLabel ?? undefined,
        disabled: uploading,
        onClick: openBrowse,
    });

    return (
        <div
            className="relative min-h-[min(100dvh,56rem)]"
            onDragEnter={handlePageDragEnter}
            onDragLeave={handlePageDragLeave}
            onDragOver={handlePageDragOver}
            onDrop={handlePageDrop}
        >
            <input
                ref={browseInputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                disabled={uploading}
                data-media-file-input="true"
                onChange={(event) => {
                    void handleFiles(mediaFilesFromList(event.target.files));
                    event.target.value = '';
                }}
            />

            <AnimatePresence>
                {pageDragging ? (
                    <motion.div
                        key="media-drop-overlay"
                        className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/40 p-6 backdrop-blur-md dark:bg-zinc-950/70"
                        aria-hidden="true"
                        data-media-drop-overlay="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                        <motion.div
                            className="flex w-full max-w-lg flex-col items-center rounded-3xl border border-white/20 bg-white/90 px-8 py-12 text-center shadow-2xl shadow-zinc-950/20 ring-1 ring-zinc-950/5 dark:border-white/15 dark:bg-zinc-800/90 dark:shadow-none dark:ring-1 dark:ring-white/10 dark:backdrop-blur-xl"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
                        >
                            <span className="flex size-14 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                                <IconUpload className="size-7" aria-hidden="true" />
                            </span>
                            <Text className="mt-5 text-lg font-semibold text-zinc-950 dark:text-white">
                                {t('media.drop_to_upload')}
                            </Text>
                            <Text className="mt-2 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                {t('media.release_to_add')}
                            </Text>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <div
                className={selectionCount > 0 ? 'space-y-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))]' : 'space-y-8'}
            >
                <PageHeader
                    title={t('media.title')}
                    actions={
                        showUploadAction ? (
                            <Button type="button" outline disabled={uploading} onClick={openBrowse}>
                                <IconUpload data-slot="icon" />
                                {uploadLabel ?? t('media.upload')}
                            </Button>
                        ) : undefined
                    }
                >
                    <PageDescription>{t('media.description')}</PageDescription>
                </PageHeader>

                <div className="space-y-3">
                    <Field className="w-full">
                        <Label className="sr-only">{t('media.search_label')}</Label>
                        <Input
                            name="media-search"
                            value={searchDraft}
                            placeholder={t('media.search_placeholder')}
                            onChange={(event) => setSearchDraft(event.target.value)}
                        />
                    </Field>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
                            <Select
                                name="media-mime"
                                className="min-w-0 flex-1"
                                aria-label={t('media.file_type')}
                                value={filters.mime}
                                onChange={(event) => setFilters({ mime: event.target.value as MediaMimeFilter })}
                            >
                                {MEDIA_MIME_FILTERS.map((option) => (
                                    <option key={option.value || 'all'} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>

                            <Select
                                name="media-sort"
                                className="min-w-0 flex-1"
                                aria-label={t('media.sort_label')}
                                value={filters.sort}
                                onChange={(event) => setFilters({ sort: event.target.value as MediaListSort })}
                            >
                                {MEDIA_SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        {canViewAllMedia ? (
                            <PillNav
                                value={filters.scope}
                                onChange={(scope) => setFilters({ scope })}
                                aria-label={t('media.scope_label')}
                                className="shrink-0"
                                indicator="slide"
                            >
                                <PillNavItem value="user" className="justify-center">
                                    {t('media.scope_mine')}
                                </PillNavItem>
                                <PillNavItem value="all" className="justify-center">
                                    {t('media.scope_all')}
                                </PillNavItem>
                            </PillNav>
                        ) : null}
                    </div>
                </div>

                {error ? (
                    <div
                        className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10"
                        role="alert"
                    >
                        <ErrorText>{error}</ErrorText>
                    </div>
                ) : null}

                {showInitialSkeleton ? <MediaGridSkeleton /> : null}

                {showEmptyLibrary ? (
                    <EmptyStateReveal animate={animateEmpty}>
                        <EmptyState
                            headline={t(MEDIA_EMPTY_STATE_KEYS.headline)}
                            description={t(MEDIA_EMPTY_STATE_KEYS.blurb)}
                            visual={<MediaEmptyVisual />}
                            action={
                                <Button type="button" color="dark/zinc" disabled={uploading} onClick={openBrowse}>
                                    <IconUpload data-slot="icon" />
                                    {uploading ? t('common.loading') : t(MEDIA_EMPTY_STATE_KEYS.cta)}
                                </Button>
                            }
                        />
                    </EmptyStateReveal>
                ) : null}

                {showFilteredEmpty ? (
                    <EmptyStateReveal animate={animateEmpty}>
                        <MediaGrid items={[]} emptyMessage={t('media.filtered_empty')} />
                    </EmptyStateReveal>
                ) : null}

                {showFilledLibrary ? (
                    <ContentReveal busy={refreshing} animate={animateContent}>
                        <div
                            ref={libraryBodyRef}
                            data-media-library-body="true"
                            style={libraryBodyMinHeight !== undefined ? { minHeight: libraryBodyMinHeight } : undefined}
                        >
                            <MediaGrid
                                items={items}
                                selectedIds={selectedIds}
                                selectionDisabled={bulkDeleting || refreshing}
                                onOpen={(item) => openDetail(item.id)}
                                onToggleSelect={(item) =>
                                    setSelectedIds((current) => toggleSelectedId(current, item.id))
                                }
                            />

                            {canLoadMore ? (
                                <div className="mt-8 flex justify-center">
                                    <Button
                                        type="button"
                                        outline
                                        disabled={loadingMore || uploading}
                                        onClick={() => void loadMore()}
                                    >
                                        {loadingMore ? t('common.loading') : t('common.load_more')}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </ContentReveal>
                ) : null}
            </div>

            <MediaDetailDrawer
                open={detailId !== null}
                mediaId={detailId}
                onClose={closeDetail}
                onUpdated={(updated) => {
                    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                }}
                onDeleted={(mediaId) => {
                    applyRemovedMedia([mediaId]);
                    setSelectedIds((current) => {
                        if (!current.has(mediaId)) {
                            return current;
                        }

                        const next = new Set(current);
                        next.delete(mediaId);
                        return next;
                    });
                }}
            />

            <Alert open={confirmBulkDeleteOpen} onClose={closeBulkDeleteConfirm} size="sm">
                <AlertTitle>
                    {selectionCount === 1
                        ? t('media.delete_bulk_title', { count: selectionCount })
                        : t('media.delete_bulk_title_other', { count: selectionCount })}
                </AlertTitle>
                <AlertDescription>{t('common.this_cannot_be_undone')}</AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={bulkDeleting} onClick={closeBulkDeleteConfirm}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="button" color="red" disabled={bulkDeleting} onClick={() => void confirmBulkDelete()}>
                        {bulkDeleting ? t('common.deleting') : t('common.delete')}
                    </Button>
                </AlertActions>
            </Alert>

            <AnimatePresence>
                {selectionCount > 0 ? (
                    <motion.div
                        key="media-selection-bar"
                        data-media-selection-actions="true"
                        className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.75 }}
                    >
                        <div className="pointer-events-auto flex w-full max-w-lg flex-wrap items-center justify-between gap-3 rounded-2xl border border-canvas-border bg-canvas-panel px-4 py-3 shadow-lg ring-1 ring-zinc-950/5 dark:border-canvas-border-dark dark:bg-canvas-panel-dark dark:shadow-black/40 dark:ring-white/10">
                            <Text className="text-sm font-medium text-zinc-950 dark:text-white" aria-live="polite">
                                {t('media.selected_count', { count: selectionCount })}
                            </Text>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    plain
                                    disabled={bulkDeleting}
                                    onClick={() => setSelectedIds(new Set())}
                                >
                                    {t('media.clear_selection')}
                                </Button>
                                <Button
                                    type="button"
                                    color="red"
                                    disabled={bulkDeleting || uploading}
                                    onClick={openBulkDeleteConfirm}
                                >
                                    <IconTrash data-slot="icon" />
                                    {bulkDeleting ? t('common.deleting') : t('common.delete')}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
