import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/20/solid';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/EmptyState';
import { Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { MediaDetailDrawer } from '@/components/media/MediaDetailDrawer';
import { MediaEmptyVisual } from '@/components/media/MediaEmptyVisual';
import { MediaGrid } from '@/components/media/MediaGrid';
import { PageHeader } from '@/components/PageHeader';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import { usePermissions } from '@/hooks/usePermissions';
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
    MEDIA_EMPTY_STATE,
    MEDIA_FILTERED_EMPTY_MESSAGE,
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
    const { canViewAllMedia } = usePermissions();
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = parseMediaListFilters(searchParams);
    const detailId = searchParams.get('detail');
    const pageDragDepth = useRef(0);
    const browseInputRef = useRef<HTMLInputElement>(null);

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
                    setError('Unable to load media.');
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
    }, [filters.scope, filters.search, filters.mime, filters.sort]);

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
            setError('Unable to load more media.');
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
            setError('Unable to load media.');
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
            toast.error('File type not supported. Use JPG, GIF, PNG, or WebP.');
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
    const isEmpty = !loading && items.length === 0;
    const showEmptyLibrary = isEmpty && !hasFilters;
    const showFilledLibrary = !loading && !isEmpty;
    const canLoadMore = showFilledLibrary && page < lastPage;
    const selectionCount = selectedIds.size;

    const uploadLabel =
        uploading && uploadProgress !== null
            ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}…`
            : uploading
              ? 'Uploading…'
              : 'Upload';

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
                                <ArrowUpTrayIcon className="size-7" aria-hidden="true" />
                            </span>
                            <Text className="mt-5 text-lg font-semibold text-zinc-950 dark:text-white">
                                Drop to upload
                            </Text>
                            <Text className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                Release to add images to your library
                            </Text>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <PageHeader
                    title="Media"
                    actions={
                        selectionCount > 0 ? (
                            <div className="flex flex-wrap items-center gap-2" data-media-selection-actions="true">
                                <Text
                                    className="text-sm font-medium text-zinc-950 dark:text-white"
                                    aria-live="polite"
                                >
                                    {selectionCount} selected
                                </Text>
                                <Button
                                    type="button"
                                    plain
                                    disabled={bulkDeleting}
                                    onClick={() => setSelectedIds(new Set())}
                                >
                                    Clear
                                </Button>
                                <Button
                                    type="button"
                                    color="red"
                                    disabled={bulkDeleting || uploading}
                                    onClick={openBulkDeleteConfirm}
                                >
                                    <TrashIcon data-slot="icon" />
                                    {bulkDeleting ? 'Deleting…' : 'Delete'}
                                </Button>
                            </div>
                        ) : (
                            <Button type="button" color="dark/zinc" disabled={uploading} onClick={openBrowse}>
                                <ArrowUpTrayIcon data-slot="icon" />
                                {uploadLabel}
                            </Button>
                        )
                    }
                />

                <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                    <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
                        <Field className="min-w-[12rem] flex-1 sm:max-w-xs">
                            <Label className="sr-only">Search media</Label>
                            <Input
                                name="media-search"
                                value={searchDraft}
                                placeholder="Search by name, alt, or caption…"
                                onChange={(event) => setSearchDraft(event.target.value)}
                            />
                        </Field>

                        <Field className="w-36">
                            <Label className="sr-only">File type</Label>
                            <Select
                                name="media-mime"
                                value={filters.mime}
                                onChange={(event) => setFilters({ mime: event.target.value as MediaMimeFilter })}
                            >
                                {MEDIA_MIME_FILTERS.map((option) => (
                                    <option key={option.value || 'all'} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </Field>

                        <Field className="w-40">
                            <Label className="sr-only">Sort media</Label>
                            <Select
                                name="media-sort"
                                value={filters.sort}
                                onChange={(event) => setFilters({ sort: event.target.value as MediaListSort })}
                            >
                                {MEDIA_SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    </div>

                    {canViewAllMedia ? (
                        <PillNav
                            value={filters.scope}
                            onChange={(scope) => setFilters({ scope })}
                            aria-label="Media author scope"
                        >
                            <PillNavItem value="user">Mine</PillNavItem>
                            <PillNavItem value="all">All authors</PillNavItem>
                        </PillNav>
                    ) : null}
                </div>

                {error ? (
                    <div
                        className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10"
                        role="alert"
                    >
                        <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
                    </div>
                ) : null}

                {loading ? (
                    <div className="mt-10 space-y-4" aria-busy="true" aria-live="polite">
                        <Text className="text-sm text-zinc-500">Loading media…</Text>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {Array.from({ length: 8 }, (_, index) => (
                                <div
                                    key={index}
                                    className="aspect-square animate-pulse rounded-xl bg-zinc-950/5 dark:bg-white/5"
                                />
                            ))}
                        </div>
                    </div>
                ) : null}

                {showEmptyLibrary ? (
                    <EmptyState
                        className="mt-10"
                        headline={MEDIA_EMPTY_STATE.headline}
                        description={MEDIA_EMPTY_STATE.blurb}
                        visual={<MediaEmptyVisual />}
                        action={
                            <Button type="button" color="dark/zinc" disabled={uploading} onClick={openBrowse}>
                                <ArrowUpTrayIcon data-slot="icon" />
                                {uploading ? 'Uploading…' : MEDIA_EMPTY_STATE.cta}
                            </Button>
                        }
                    />
                ) : null}

                {isEmpty && hasFilters ? (
                    <MediaGrid className="mt-10" items={[]} emptyMessage={MEDIA_FILTERED_EMPTY_MESSAGE} />
                ) : null}

                {showFilledLibrary ? (
                    <>
                        <MediaGrid
                            className="mt-10"
                            items={items}
                            selectedIds={selectedIds}
                            selectionDisabled={bulkDeleting}
                            onOpen={(item) => openDetail(item.id)}
                            onToggleSelect={(item) => setSelectedIds((current) => toggleSelectedId(current, item.id))}
                        />

                        {canLoadMore ? (
                            <div className="mt-8 flex justify-center">
                                <Button
                                    type="button"
                                    outline
                                    disabled={loadingMore || uploading}
                                    onClick={() => void loadMore()}
                                >
                                    {loadingMore ? 'Loading…' : 'Load more'}
                                </Button>
                            </div>
                        ) : null}
                    </>
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
                    Delete {selectionCount} {selectionCount === 1 ? 'image' : 'images'}?
                </AlertTitle>
                <AlertDescription>This cannot be undone.</AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={bulkDeleting} onClick={closeBulkDeleteConfirm}>
                        Cancel
                    </Button>
                    <Button type="button" color="red" disabled={bulkDeleting} onClick={() => void confirmBulkDelete()}>
                        {bulkDeleting ? 'Deleting…' : 'Delete'}
                    </Button>
                </AlertActions>
            </Alert>
        </div>
    );
}
