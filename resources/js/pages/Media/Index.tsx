import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/button';
import { Field, Label } from '@/components/fieldset';
import { Heading } from '@/components/heading';
import { Input } from '@/components/input';
import { MediaDropzone } from '@/components/media/MediaDropzone';
import { MediaGrid } from '@/components/media/MediaGrid';
import {
    Pagination,
    PaginationGap,
    PaginationList,
    PaginationNext,
    PaginationPage,
    PaginationPrevious,
} from '@/components/pagination';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import { usePermissions } from '@/hooks/usePermissions';
import { mediaApi, uploadMedia } from '@/lib/api/media';
import {
    MEDIA_MIME_FILTERS,
    mediaFilesFromList,
    mediaIndexPath,
    mediaIndexQueryParams,
    parseMediaListFilters,
    type MediaListFilters,
    type MediaMimeFilter,
} from '@/lib/media/list';
import type { Media, Paginated } from '@/types/api';

function updateFilters(current: URLSearchParams, patch: Partial<MediaListFilters>, resetPage = false): URLSearchParams {
    const next = new URLSearchParams(current);
    const currentFilters = parseMediaListFilters(current);

    const scope = patch.scope ?? currentFilters.scope;
    const search = patch.search !== undefined ? patch.search : currentFilters.search;
    const mime = patch.mime !== undefined ? patch.mime : currentFilters.mime;
    const page = resetPage ? 1 : (patch.page ?? currentFilters.page);

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

    if (page > 1) {
        next.set('page', String(page));
    } else {
        next.delete('page');
    }

    return next;
}

function paginationWindow(currentPage: number, lastPage: number): (number | 'gap')[] {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, lastPage, currentPage, currentPage - 1, currentPage + 1]);
    const sorted = [...pages].filter((page) => page >= 1 && page <= lastPage).sort((a, b) => a - b);
    const result: (number | 'gap')[] = [];

    for (let index = 0; index < sorted.length; index += 1) {
        const page = sorted[index];
        const previous = sorted[index - 1];

        if (index > 0 && previous !== undefined && page - previous > 1) {
            result.push('gap');
        }

        result.push(page);
    }

    return result;
}

export default function MediaIndex() {
    const { canViewAllMedia } = usePermissions();
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = parseMediaListFilters(searchParams);
    const queryKey = searchParams.toString();
    const pageDragDepth = useRef(0);

    const [searchDraft, setSearchDraft] = useState(filters.search);
    const [syncedSearch, setSyncedSearch] = useState(filters.search);
    const [response, setResponse] = useState<Paginated<Media> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [pageDragging, setPageDragging] = useState(false);

    if (filters.search !== syncedSearch) {
        setSyncedSearch(filters.search);
        setSearchDraft(filters.search);
    }

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        const currentFilters = parseMediaListFilters(searchParams);

        queueMicrotask(() => {
            if (!cancelled) {
                setLoading(true);
                setError(null);
            }
        });

        mediaApi
            .index(mediaIndexQueryParams(currentFilters), controller.signal)
            .then((data) => {
                if (!cancelled) {
                    setResponse(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Unable to load media.');
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
    }, [queryKey, searchParams]);

    function setFilters(patch: Partial<MediaListFilters>, resetPage = false) {
        setSearchParams(updateFilters(searchParams, patch, resetPage));
    }

    function applySearch() {
        setFilters({ search: searchDraft }, true);
    }

    async function handleFiles(files: File[]) {
        if (files.length === 0) {
            setError('File type not supported. Use JPG, GIF, PNG, or WebP.');
            return;
        }

        setUploading(true);
        setError(null);

        const uploadedItems: Media[] = [];

        try {
            for (const file of files) {
                uploadedItems.push(await uploadMedia(file));
            }

            setSearchParams(updateFilters(new URLSearchParams(), { scope: 'user', search: '', mime: '', page: 1 }));
            setResponse((current) => {
                if (current === null) {
                    return current;
                }

                const uploadedIds = new Set(uploadedItems.map((item) => item.id));

                return {
                    ...current,
                    data: [...uploadedItems, ...current.data.filter((item) => !uploadedIds.has(item.id))],
                };
            });

            if (searchParams.toString() === '') {
                const data = await mediaApi.index(
                    mediaIndexQueryParams({ scope: 'user', search: '', mime: '', page: 1 })
                );
                setResponse(data);
            }
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
        } finally {
            setUploading(false);
        }
    }

    function handlePageDragEnter(event: DragEvent<HTMLDivElement>) {
        if (!event.dataTransfer.types.includes('Files') || uploading) {
            return;
        }

        event.preventDefault();
        pageDragDepth.current += 1;
        setPageDragging(true);
    }

    function handlePageDragLeave(event: DragEvent<HTMLDivElement>) {
        if (!pageDragging) {
            return;
        }

        event.preventDefault();
        pageDragDepth.current = Math.max(0, pageDragDepth.current - 1);

        if (pageDragDepth.current === 0) {
            setPageDragging(false);
        }
    }

    function handlePageDragOver(event: DragEvent<HTMLDivElement>) {
        if (!event.dataTransfer.types.includes('Files') || uploading) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    function handlePageDrop(event: DragEvent<HTMLDivElement>) {
        if (!event.dataTransfer.types.includes('Files')) {
            return;
        }

        event.preventDefault();
        pageDragDepth.current = 0;
        setPageDragging(false);

        if (uploading) {
            return;
        }

        void handleFiles(mediaFilesFromList(event.dataTransfer.files));
    }

    const hasFilters = filters.search !== '' || filters.mime !== '';
    const isEmpty = !loading && (response === null || response.data.length === 0);

    return (
        <div
            className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
            onDragEnter={handlePageDragEnter}
            onDragLeave={handlePageDragLeave}
            onDragOver={handlePageDragOver}
            onDrop={handlePageDrop}
        >
            {pageDragging ? (
                <div className="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-zinc-950 bg-white/80 dark:border-white dark:bg-zinc-950/80">
                    <div className="text-center">
                        <Text className="text-base font-medium text-zinc-950 dark:text-white">Drop to upload</Text>
                        <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Images will be added to your library
                        </Text>
                    </div>
                </div>
            ) : null}

            <div>
                <Heading>Media</Heading>
                <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Browse and manage images for your posts — drop files anywhere on this page
                </Text>
            </div>

            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
                    <Field className="min-w-[12rem] flex-1 sm:max-w-xs">
                        <Label className="sr-only">Search media</Label>
                        <Input
                            name="media-search"
                            value={searchDraft}
                            placeholder="Search media…"
                            onChange={(event) => setSearchDraft(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    applySearch();
                                }
                            }}
                        />
                    </Field>

                    <Field className="w-36">
                        <Label className="sr-only">File type</Label>
                        <Select
                            name="media-mime"
                            value={filters.mime}
                            onChange={(event) => setFilters({ mime: event.target.value as MediaMimeFilter }, true)}
                        >
                            {MEDIA_MIME_FILTERS.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    <Button type="button" outline onClick={applySearch}>
                        <MagnifyingGlassIcon data-slot="icon" />
                        Search
                    </Button>
                </div>

                {canViewAllMedia ? (
                    <PillNav
                        value={filters.scope}
                        onChange={(scope) => setFilters({ scope }, true)}
                        aria-label="Media author scope"
                    >
                        <PillNavItem value="user">Mine</PillNavItem>
                        <PillNavItem value="all">All authors</PillNavItem>
                    </PillNav>
                ) : null}
            </div>

            {error ? <Text className="mt-6 text-sm text-red-600 dark:text-red-500">{error}</Text> : null}

            <MediaDropzone
                className="mt-8"
                uploading={uploading}
                spacious={isEmpty && !hasFilters}
                onFiles={(files) => void handleFiles(files)}
            />

            {loading ? (
                <Text className="mt-8 text-sm text-zinc-500">Loading media…</Text>
            ) : isEmpty ? (
                hasFilters ? (
                    <MediaGrid className="mt-8" items={[]} emptyMessage="No images match your filters." />
                ) : null
            ) : (
                <>
                    <MediaGrid
                        className="mt-8"
                        items={response!.data}
                        hrefForItem={(item) => `/media/${item.id}`}
                    />

                    {response!.last_page > 1 ? (
                        <Pagination className="mt-8">
                            <PaginationPrevious
                                href={
                                    response!.current_page > 1
                                        ? mediaIndexPath({ ...filters, page: response!.current_page - 1 })
                                        : null
                                }
                            />
                            <PaginationList>
                                {paginationWindow(response!.current_page, response!.last_page).map((item, index) =>
                                    item === 'gap' ? (
                                        <PaginationGap key={`gap-${index}`} />
                                    ) : (
                                        <PaginationPage
                                            key={item}
                                            href={mediaIndexPath({ ...filters, page: item })}
                                            current={item === response!.current_page}
                                        >
                                            {item}
                                        </PaginationPage>
                                    )
                                )}
                            </PaginationList>
                            <PaginationNext
                                href={
                                    response!.current_page < response!.last_page
                                        ? mediaIndexPath({ ...filters, page: response!.current_page + 1 })
                                        : null
                                }
                            />
                        </Pagination>
                    ) : null}
                </>
            )}
        </div>
    );
}
