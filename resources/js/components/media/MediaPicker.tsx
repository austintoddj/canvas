import { useEffect, useState } from 'react';

import { Button } from '@/components/button';
import { Dialog, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog';
import { Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { MediaDropzone } from '@/components/media/MediaDropzone';
import { MediaGrid } from '@/components/media/MediaGrid';
import { MediaGridSkeleton } from '@/components/media/MediaGridSkeleton';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { ErrorText } from '@/components/text';
import { usePermissions } from '@/hooks/usePermissions';
import { isInitialLoading, isRefreshing } from '@/lib/async-ui';
import { mediaApi, uploadMedia } from '@/lib/api/media';
import { MEDIA_SEARCH_DEBOUNCE_MS, mediaIndexQueryParams, type MediaListFilters } from '@/lib/media/list';
import type { Media, Paginated } from '@/types/api';

type MediaPickerPanelProps = {
    onSelect: (url: string, media?: Media) => void;
};

type MediaQuery = Pick<MediaListFilters, 'scope' | 'search' | 'page'>;

async function fetchMediaPage(query: MediaQuery, signal?: AbortSignal): Promise<Paginated<Media>> {
    return mediaApi.index(
        mediaIndexQueryParams({
            scope: query.scope,
            search: query.search,
            mime: '',
            sort: 'newest',
            page: query.page,
        }),
        signal
    );
}

export function MediaPickerPanel({ onSelect }: MediaPickerPanelProps) {
    const { canViewAllMedia } = usePermissions();

    const [scope, setScope] = useState<'user' | 'all'>('user');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [media, setMedia] = useState<Media[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, MEDIA_SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;

        queueMicrotask(() => {
            if (!cancelled) {
                setLoading(true);
                setError(null);
            }
        });

        void fetchMediaPage({ scope, search: debouncedSearch, page: 1 }, controller.signal)
            .then((response) => {
                if (cancelled) {
                    return;
                }

                setMedia(response.data);
                setPage(response.current_page);
                setLastPage(response.last_page);
            })
            .catch(() => {
                if (!cancelled && !controller.signal.aborted) {
                    setError('Unable to load media.');
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
    }, [scope, debouncedSearch]);

    async function loadMore() {
        if (loadingMore || page >= lastPage) {
            return;
        }

        setLoadingMore(true);
        setError(null);

        try {
            const response = await fetchMediaPage({ scope, search: debouncedSearch, page: page + 1 });
            setMedia((current) => [...current, ...response.data]);
            setPage(response.current_page);
            setLastPage(response.last_page);
        } catch {
            setError('Unable to load media.');
        } finally {
            setLoadingMore(false);
        }
    }

    async function handleFiles(files: File[]) {
        if (files.length === 0) {
            setError('File type not supported. Use JPG, GIF, PNG, or WebP.');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const uploaded = await uploadMedia(files[0]);
            setMedia((current) => [uploaded, ...current]);
            onSelect(uploaded.url, uploaded);
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
        } finally {
            setUploading(false);
        }
    }

    const showInitialSkeleton = isInitialLoading(loading, media.length);
    const refreshing = isRefreshing(loading, media.length);

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <Field className="min-w-[12rem] flex-1">
                    <Label className="sr-only">Search media</Label>
                    <Input
                        name="media-search"
                        value={search}
                        placeholder="Search media…"
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </Field>

                {canViewAllMedia ? (
                    <PillNav value={scope} onChange={(next) => setScope(next)} aria-label="Media author scope">
                        <PillNavItem value="user">Mine</PillNavItem>
                        <PillNavItem value="all">All</PillNavItem>
                    </PillNav>
                ) : null}
            </div>

            <MediaDropzone
                className="mt-4"
                uploading={uploading}
                multiple={false}
                label="Drop an image here, or click to browse"
                onFiles={(files) => void handleFiles(files)}
            />

            {error ? <ErrorText className="mt-4">{error}</ErrorText> : null}

            {showInitialSkeleton ? <MediaGridSkeleton className="mt-6" count={6} compact /> : null}

            {!showInitialSkeleton ? (
                <div
                    className={
                        refreshing
                            ? 'mt-6 opacity-50 transition-opacity duration-200'
                            : 'mt-6 transition-opacity duration-200'
                    }
                    aria-busy={refreshing || undefined}
                >
                    <MediaGrid
                        items={media}
                        compact
                        emptyMessage="No images found. Drop one above to get started."
                        onSelect={(item) => onSelect(item.url, item)}
                    />
                </div>
            ) : null}

            {page < lastPage && !loading ? (
                <div className="mt-4 flex justify-center">
                    <Button type="button" outline disabled={loadingMore} onClick={() => void loadMore()}>
                        {loadingMore ? 'Loading…' : 'Load more'}
                    </Button>
                </div>
            ) : null}
        </div>
    );
}

type MediaPickerProps = {
    open: boolean;
    onClose: () => void;
    onSelect: (url: string, media?: Media) => void;
};

export default function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
    return (
        <Dialog open={open} onClose={onClose} size="4xl">
            <DialogTitle>Choose image</DialogTitle>
            <DialogDescription>Browse your media library or upload a new image.</DialogDescription>

            <DialogBody>
                <MediaPickerPanel
                    onSelect={(url, media) => {
                        onSelect(url, media);
                        onClose();
                    }}
                />
            </DialogBody>
        </Dialog>
    );
}
