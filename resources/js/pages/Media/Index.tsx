import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState, type DragEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { EmptyState } from '@/components/EmptyState';
import { EmptyStateReveal } from '@/components/EmptyStateReveal';
import { ErrorMessage, Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { MediaDetailDrawer } from '@/components/media/MediaDetailDrawer';
import { MediaEmptyVisual } from '@/components/media/MediaEmptyVisual';
import { MediaGrid } from '@/components/media/MediaGrid';
import { MediaGridSkeleton } from '@/components/media/MediaGridSkeleton';
import { MediaBulkTagMenu } from '@/components/media/MediaBulkTagMenu';
import { MediaTagRail } from '@/components/media/MediaTagRail';
import { MediaViewMenu } from '@/components/media/MediaViewMenu';
import { PageHeader } from '@/components/PageHeader';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMobilePageAction } from '@/hooks/useMobilePageAction';
import { usePermissions } from '@/hooks/usePermissions';
import { isInitialLoading, isRefreshing, shouldShowEmpty } from '@/lib/async-ui';
import { ALLOWED_MEDIA_MIME_TYPES, mediaApi, uploadMedia } from '@/lib/api/media';
import {
    createMediaTag,
    createOrReuseMediaTag,
    isMediaTagNameConflict,
    mediaTagNameTaken,
    mediaTagsApi,
} from '@/lib/api/media-tags';
import {
    appendMediaItems,
    chunkMediaIds,
    destroyMediaItems,
    filtersAfterUpload,
    mediaMatchesTagFilter,
    prependMediaItems,
    removeMediaItems,
    resolveActiveMediaTag,
    shouldRefillMediaListAfterDelete,
    summarizeMediaDestroys,
    summarizeMediaTagAttaches,
    summarizeMediaTagDetaches,
    summarizeMediaUploads,
    toggleSelectedId,
    uploadMediaFiles,
    withMediaTagMembership,
} from '@/lib/media/batch';
import { isFileDragTypes, reducePageDrag } from '@/lib/media/drag';
import {
    MEDIA_EMPTY_STATE_KEYS,
    MEDIA_SEARCH_DEBOUNCE_MS,
    mediaFilesFromList,
    mediaIndexQueryParams,
    mediaListHasActiveFilters,
    nextCommittedMediaSearch,
    parseMediaListFilters,
    updateMediaListSearchParams,
    type MediaUrlFilterPatch,
} from '@/lib/media/list';
import { toast, toastFromTone } from '@/lib/toast';
import type { Media, MediaTag } from '@/types/api';
import { IconSearch, IconTrash, IconUpload } from '@tabler/icons-react';

const ACCEPT = ALLOWED_MEDIA_MIME_TYPES.join(',');

function updateFilters(current: URLSearchParams, patch: MediaUrlFilterPatch): URLSearchParams {
    return updateMediaListSearchParams(current, patch);
}

function withoutIds(selected: ReadonlySet<string>, ids: readonly string[]): Set<string> {
    const next = new Set(selected);

    for (const id of ids) {
        next.delete(id);
    }

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
    const [libraryTags, setLibraryTags] = useState<MediaTag[]>([]);
    const [tagMeta, setTagMeta] = useState({ all_count: 0, untagged_count: 0, truncated: false });
    const [bulkTagging, setBulkTagging] = useState(false);
    const [creatingTag, setCreatingTag] = useState(false);
    const [renamingTag, setRenamingTag] = useState<MediaTag | null>(null);
    const [deletingTag, setDeletingTag] = useState<MediaTag | null>(null);
    const [tagNameDraft, setTagNameDraft] = useState('');
    const [tagFormError, setTagFormError] = useState<string | null>(null);
    const [tagBusy, setTagBusy] = useState(false);
    const libraryBodyRef = useRef<HTMLDivElement>(null);
    const bulkTaggingRef = useRef(false);
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
                    tag: filters.tag,
                    untagged: filters.untagged,
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
    }, [filters.scope, filters.search, filters.mime, filters.sort, filters.tag, filters.untagged, t]);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        mediaTagsApi
            .index({ scope: filters.scope }, controller.signal)
            .then((response) => {
                if (!cancelled) {
                    setLibraryTags(response.data);
                    setTagMeta(response.meta);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setLibraryTags([]);
                }
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [filters.scope]);

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

    function setFilters(patch: MediaUrlFilterPatch) {
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
                    tag: filters.tag,
                    untagged: filters.untagged,
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
                    tag: filters.tag,
                    untagged: filters.untagged,
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

        const activeTag =
            filters.tag !== null && filters.tag !== undefined
                ? (libraryTags.find((tag) => tag.id === filters.tag) ?? { id: filters.tag, name: '' })
                : null;
        let attachWarning = false;
        let completed = 0;
        const results = await uploadMediaFiles(files, async (file) => {
            completed += 1;
            setUploadProgress({ current: completed, total: files.length });
            const media = await uploadMedia(file);

            if (activeTag === null) {
                return media;
            }

            try {
                const attached = await mediaTagsApi.attach(activeTag.id, { media_ids: [media.id] });

                if (!attached.attached.includes(media.id)) {
                    attachWarning = true;

                    return media;
                }

                const tags = [...(media.tags ?? [])];

                if (!tags.some((tag) => tag.id === activeTag.id)) {
                    tags.push({ id: activeTag.id, name: activeTag.name || activeTag.id });
                }

                return { ...media, tags };
            } catch {
                attachWarning = true;

                return media;
            }
        });

        const summary = summarizeMediaUploads(results);
        setUploadProgress(null);
        setUploading(false);

        if (summary === null) {
            return;
        }

        toastFromTone(summary.message, summary.tone);

        if (attachWarning) {
            toast.warning(t('media.tags_attach_failed'));
        }

        if (summary.succeeded.length === 0) {
            return;
        }

        const visibleUploads = summary.succeeded.filter((item) => mediaMatchesTagFilter(item.tags, filters));

        if (visibleUploads.length > 0) {
            setItems((current) => prependMediaItems(current, visibleUploads));
        }

        void refreshTags();

        const nextFilters = filtersAfterUpload(filters);

        if (
            nextFilters.scope !== filters.scope ||
            nextFilters.search !== filters.search ||
            nextFilters.mime !== filters.mime
        ) {
            setSearchParams(updateFilters(searchParams, nextFilters));
        }
    }

    async function refreshTags() {
        try {
            const response = await mediaTagsApi.index({ scope: filters.scope });
            setLibraryTags(response.data);
            setTagMeta(response.meta);
        } catch {
            setLibraryTags([]);
        }
    }

    async function attachTagToIds(tag: { id: string; name: string }, ids: string[]) {
        const attached: string[] = [];
        const skipped: string[] = [];

        for (const chunk of chunkMediaIds(ids)) {
            const result = await mediaTagsApi.attach(tag.id, { media_ids: chunk }, { scope: filters.scope });
            attached.push(...result.attached);
            skipped.push(...result.skipped);
        }

        const summary = summarizeMediaTagAttaches(attached, skipped, tag.name);

        if (summary !== null) {
            toastFromTone(summary.message, summary.tone);
        }

        if (attached.length > 0) {
            setItems((current) => withMediaTagMembership(current, attached, tag, 'attach', filters));

            if (filters.untagged) {
                setSelectedIds((current) => withoutIds(current, attached));
            }

            void refreshTags();
        }

        return attached;
    }

    async function detachActiveTag(tag: { id: string; name: string }) {
        const ids = Array.from(selectedIds);

        if (ids.length === 0 || bulkTaggingRef.current || bulkDeleting) {
            return;
        }

        bulkTaggingRef.current = true;
        setBulkTagging(true);

        const detached: string[] = [];
        const skipped: string[] = [];

        try {
            for (const chunk of chunkMediaIds(ids)) {
                try {
                    const result = await mediaTagsApi.detach(tag.id, { media_ids: chunk }, { scope: filters.scope });
                    detached.push(...result.detached);
                    skipped.push(...result.skipped);
                } catch {
                    skipped.push(...chunk);
                }
            }

            const summary = summarizeMediaTagDetaches(detached, skipped, tag.name);

            if (summary !== null) {
                toastFromTone(summary.message, summary.tone);
            }

            if (detached.length > 0) {
                setItems((current) => withMediaTagMembership(current, detached, tag, 'detach', filters));
                setSelectedIds((current) => withoutIds(current, detached));
                void refreshTags();
            }
        } finally {
            bulkTaggingRef.current = false;
            setBulkTagging(false);
        }
    }

    async function handlePickBulkTag(tag: MediaTag) {
        const ids = Array.from(selectedIds);
        await attachTagToIds(tag, ids);
    }

    async function handleCreateBulkTag(name: string) {
        const tag = await createOrReuseMediaTag(name);
        setLibraryTags((current) => (current.some((item) => item.id === tag.id) ? current : [...current, tag]));
        await handlePickBulkTag(tag);
    }

    async function handleCreateLibraryTag() {
        const name = tagNameDraft.trim();

        if (name === '' || tagBusy) {
            return;
        }

        if (mediaTagNameTaken(name, libraryTags)) {
            setTagFormError(t('media.tags_exists'));
            return;
        }

        setTagBusy(true);
        setTagFormError(null);

        try {
            const tag = await createMediaTag(name);
            setCreatingTag(false);
            setTagNameDraft('');
            toast.success(t('media.tags_created'));
            await refreshTags();
            setFilters({ tag: tag.id });
        } catch (error) {
            if (isMediaTagNameConflict(error)) {
                setTagFormError(t('media.tags_exists'));
            } else {
                toast.error(t('media.tags_create_error'));
            }
        } finally {
            setTagBusy(false);
        }
    }

    async function handleRenameLibraryTag() {
        if (renamingTag === null || tagBusy) {
            return;
        }

        const name = tagNameDraft.trim();

        if (name === '') {
            return;
        }

        if (mediaTagNameTaken(name, libraryTags, renamingTag.id)) {
            setTagFormError(t('media.tags_exists'));
            return;
        }

        setTagBusy(true);
        setTagFormError(null);

        try {
            await mediaTagsApi.store(renamingTag.id, { name });
            setRenamingTag(null);
            setTagNameDraft('');
            toast.success(t('media.tags_renamed'));
            await refreshTags();
            setItems((current) =>
                current.map((item) => ({
                    ...item,
                    tags: (item.tags ?? []).map((tag) => (tag.id === renamingTag.id ? { ...tag, name } : tag)),
                }))
            );
        } catch (error) {
            if (isMediaTagNameConflict(error)) {
                setTagFormError(t('media.tags_exists'));
            } else {
                toast.error(t('media.tags_save_error'));
            }
        } finally {
            setTagBusy(false);
        }
    }

    async function handleDeleteLibraryTag() {
        if (deletingTag === null || tagBusy) {
            return;
        }

        setTagBusy(true);

        try {
            await mediaTagsApi.destroy(deletingTag.id);
            const removedId = deletingTag.id;
            setDeletingTag(null);
            toast.success(t('media.tags_deleted'));

            if (filters.tag === removedId) {
                setFilters({ tag: null, untagged: false });
            }

            setItems((current) =>
                current.map((item) => ({
                    ...item,
                    tags: (item.tags ?? []).filter((tag) => tag.id !== removedId),
                }))
            );
            await refreshTags();
        } catch {
            toast.error(t('media.tags_save_error'));
        } finally {
            setTagBusy(false);
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
    const filteredTag = resolveActiveMediaTag(filters.tag, libraryTags, items);
    const tagActionBusy = bulkDeleting || bulkTagging || uploading;

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
                className={
                    selectionCount > 0
                        ? 'space-y-8 pb-[calc(8.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))]'
                        : 'space-y-8'
                }
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
                    <div
                        className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3"
                        data-media-list-filters="true"
                    >
                        <div className="min-w-0 lg:flex-1">
                            <MediaTagRail
                                tags={libraryTags}
                                allCount={tagMeta.all_count}
                                untaggedCount={tagMeta.untagged_count}
                                selectedTagId={filters.tag ?? null}
                                untagged={Boolean(filters.untagged)}
                                canManage={canViewAllMedia}
                                onSelectAll={() => setFilters({ tag: null, untagged: false })}
                                onSelectUntagged={() => setFilters({ untagged: true })}
                                onSelectTag={(tag) => setFilters({ tag: tag.id })}
                                onCreate={() => {
                                    setTagNameDraft('');
                                    setTagFormError(null);
                                    setCreatingTag(true);
                                }}
                                onRename={(tag) => {
                                    setTagNameDraft(tag.name);
                                    setTagFormError(null);
                                    setRenamingTag(tag);
                                }}
                                onDelete={(tag) => setDeletingTag(tag)}
                            />
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:shrink-0">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <label className="sr-only" htmlFor="media-search">
                                    {t('media.search_label')}
                                </label>
                                <div className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-zinc-950/[0.04] px-3 ring-1 ring-zinc-950/8 sm:h-8 sm:w-52 sm:flex-none sm:px-2.5 dark:bg-white/5 dark:ring-white/10">
                                    <IconSearch className="size-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
                                    <input
                                        id="media-search"
                                        name="media-search"
                                        value={searchDraft}
                                        placeholder={t('media.search_label')}
                                        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 sm:text-[13px] dark:text-white dark:placeholder:text-zinc-500"
                                        onChange={(event) => setSearchDraft(event.target.value)}
                                    />
                                </div>
                                <MediaViewMenu
                                    mime={filters.mime}
                                    sort={filters.sort}
                                    onMimeChange={(mime) => setFilters({ mime })}
                                    onSortChange={(sort) => setFilters({ sort })}
                                />
                            </div>
                            {canViewAllMedia ? (
                                <PillNav
                                    value={filters.scope}
                                    onChange={(scope) => setFilters({ scope })}
                                    aria-label={t('media.scope_label')}
                                    className="w-full sm:w-auto"
                                    indicator="slide"
                                >
                                    <PillNavItem value="user">{t('media.scope_mine')}</PillNavItem>
                                    <PillNavItem value="all">{t('media.scope_all')}</PillNavItem>
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
                            <MediaGrid
                                items={[]}
                                emptyMessage={filters.tag ? t('media.tags_empty_filter') : t('media.filtered_empty')}
                            />
                        </EmptyStateReveal>
                    ) : null}

                    {showFilledLibrary ? (
                        <ContentReveal busy={refreshing} animate={animateContent}>
                            <div
                                ref={libraryBodyRef}
                                data-media-library-body="true"
                                style={
                                    libraryBodyMinHeight !== undefined ? { minHeight: libraryBodyMinHeight } : undefined
                                }
                            >
                                <MediaGrid
                                    items={items}
                                    selectedIds={selectedIds}
                                    selectionDisabled={bulkDeleting || refreshing}
                                    showTagChips
                                    onTagChipClick={(tag) => setFilters({ tag: tag.id })}
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
            </div>

            <MediaDetailDrawer
                open={detailId !== null}
                mediaId={detailId}
                onClose={closeDetail}
                onUpdated={(updated) => {
                    const stillVisible = mediaMatchesTagFilter(updated.tags, filters);

                    setItems((current) =>
                        current.flatMap((item) => {
                            if (item.id !== updated.id) {
                                return [item];
                            }

                            return stillVisible ? [updated] : [];
                        })
                    );

                    if (!stillVisible) {
                        setSelectedIds((current) => withoutIds(current, [updated.id]));
                    }

                    void refreshTags();
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

            <Alert
                open={creatingTag}
                onClose={() => {
                    if (!tagBusy) {
                        setCreatingTag(false);
                        setTagFormError(null);
                    }
                }}
                size="sm"
            >
                <AlertTitle>{t('media.tags_new')}</AlertTitle>
                <Field className="mt-3">
                    <Label>{t('media.tags_name')}</Label>
                    <Input
                        name="new-media-tag"
                        value={tagNameDraft}
                        invalid={Boolean(tagFormError)}
                        onChange={(event) => {
                            setTagNameDraft(event.target.value);
                            if (tagFormError !== null) {
                                setTagFormError(null);
                            }
                        }}
                    />
                    {tagFormError ? <ErrorMessage>{tagFormError}</ErrorMessage> : null}
                </Field>
                <AlertActions>
                    <Button type="button" plain disabled={tagBusy} onClick={() => setCreatingTag(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="button"
                        color="dark/zinc"
                        disabled={tagBusy}
                        onClick={() => void handleCreateLibraryTag()}
                    >
                        {t('media.tags_new')}
                    </Button>
                </AlertActions>
            </Alert>

            <Alert
                open={renamingTag !== null}
                onClose={() => {
                    if (!tagBusy) {
                        setRenamingTag(null);
                        setTagFormError(null);
                    }
                }}
                size="sm"
            >
                <AlertTitle>{t('media.tags_rename')}</AlertTitle>
                <Field className="mt-3">
                    <Label>{t('media.tags_name')}</Label>
                    <Input
                        name="rename-media-tag"
                        value={tagNameDraft}
                        invalid={Boolean(tagFormError)}
                        onChange={(event) => {
                            setTagNameDraft(event.target.value);
                            if (tagFormError !== null) {
                                setTagFormError(null);
                            }
                        }}
                    />
                    {tagFormError ? <ErrorMessage>{tagFormError}</ErrorMessage> : null}
                </Field>
                <AlertActions>
                    <Button type="button" plain disabled={tagBusy} onClick={() => setRenamingTag(null)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="button"
                        color="dark/zinc"
                        disabled={tagBusy}
                        onClick={() => void handleRenameLibraryTag()}
                    >
                        {t('common.save')}
                    </Button>
                </AlertActions>
            </Alert>

            <Alert
                open={deletingTag !== null}
                onClose={() => {
                    if (!tagBusy) {
                        setDeletingTag(null);
                    }
                }}
                size="sm"
            >
                <AlertTitle>{t('media.tags_delete_title', { name: deletingTag?.name ?? '' })}</AlertTitle>
                <AlertDescription>{t('media.tags_delete_body')}</AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={tagBusy} onClick={() => setDeletingTag(null)}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="button" color="red" disabled={tagBusy} onClick={() => void handleDeleteLibraryTag()}>
                        {t('media.tags_delete')}
                    </Button>
                </AlertActions>
            </Alert>

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
                        <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-canvas-border bg-canvas-panel px-3 py-3 shadow-lg ring-1 ring-zinc-950/5 sm:px-4 dark:border-canvas-border-dark dark:bg-canvas-panel-dark dark:shadow-black/40 dark:ring-white/10">
                            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                <div className="flex items-center justify-between gap-3 sm:justify-start">
                                    <Text
                                        className="text-sm font-medium text-zinc-950 dark:text-white"
                                        aria-live="polite"
                                    >
                                        {t('media.selected_count', { count: selectionCount })}
                                    </Text>
                                    <Button
                                        type="button"
                                        plain
                                        disabled={tagActionBusy}
                                        onClick={() => setSelectedIds(new Set())}
                                    >
                                        {t('media.clear_selection')}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                                    {filteredTag !== null ? (
                                        <Button
                                            type="button"
                                            outline
                                            className="w-full sm:w-auto"
                                            disabled={tagActionBusy}
                                            onClick={() => {
                                                void detachActiveTag(filteredTag);
                                            }}
                                        >
                                            {t('media.tags_remove')}
                                        </Button>
                                    ) : (
                                        <MediaBulkTagMenu
                                            tags={libraryTags}
                                            disabled={tagActionBusy}
                                            onPick={(tag) => void handlePickBulkTag(tag)}
                                            onCreate={(name) => handleCreateBulkTag(name)}
                                        />
                                    )}
                                    <Button
                                        type="button"
                                        color="red"
                                        className="w-full sm:w-auto"
                                        disabled={tagActionBusy}
                                        onClick={openBulkDeleteConfirm}
                                    >
                                        <IconTrash data-slot="icon" />
                                        {bulkDeleting ? t('common.deleting') : t('common.delete')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
