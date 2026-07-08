import { MagnifyingGlassIcon, PhotoIcon } from '@heroicons/react/20/solid';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/button';
import { Dialog, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog';
import { Description, Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Text } from '@/components/text';
import { usePermissions } from '@/hooks/usePermissions';
import { mediaApi, uploadMedia } from '@/lib/api/media';
import type { Media, Paginated } from '@/types/api';

type MediaPickerPanelProps = {
    onSelect: (url: string, media?: Media) => void;
};

type MediaQuery = {
    scope: 'user' | 'all';
    search: string;
    page: number;
};

async function fetchMediaPage(query: MediaQuery, signal?: AbortSignal): Promise<Paginated<Media>> {
    return mediaApi.index(
        {
            scope: query.scope,
            search: query.search.trim() === '' ? undefined : query.search.trim(),
            page: query.page,
        },
        signal
    );
}

export function MediaPickerPanel({ onSelect }: MediaPickerPanelProps) {
    const { canViewAllMedia } = usePermissions();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [scope, setScope] = useState<'user' | 'all'>('user');
    const [search, setSearch] = useState('');
    const [media, setMedia] = useState<Media[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        void fetchMediaPage({ scope: 'user', search: '', page: 1 }, controller.signal)
            .then((response) => {
                if (cancelled) {
                    return;
                }

                setMedia(response.data);
                setPage(response.current_page);
                setLastPage(response.last_page);
                setLoading(false);
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Unable to load media.');
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, []);

    async function loadMedia(nextPage: number, append: boolean, query: MediaQuery) {
        if (nextPage === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        setError(null);

        try {
            const response = await fetchMediaPage(query);

            setMedia((current) => (append ? [...current, ...response.data] : response.data));
            setPage(response.current_page);
            setLastPage(response.last_page);
        } catch {
            setError('Unable to load media.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    function currentQuery(pageNumber: number = 1): MediaQuery {
        return { scope, search, page: pageNumber };
    }

    async function handleUpload(file: File) {
        setUploading(true);
        setError(null);

        try {
            const uploaded = await uploadMedia(file);
            setMedia((current) => [uploaded, ...current]);
            onSelect(uploaded.url, uploaded);
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
        } finally {
            setUploading(false);
        }
    }

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
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                void loadMedia(1, false, currentQuery());
                            }
                        }}
                    />
                </Field>

                <div className="flex flex-wrap items-center gap-2">
                    {canViewAllMedia ? (
                        <div className="flex rounded-lg border border-zinc-950/10 p-0.5 dark:border-white/10">
                            <Button
                                type="button"
                                plain
                                className={scope === 'user' ? 'bg-zinc-950/5 dark:bg-white/10' : ''}
                                onClick={() => {
                                    setScope('user');
                                    void loadMedia(1, false, { scope: 'user', search, page: 1 });
                                }}
                            >
                                Mine
                            </Button>
                            <Button
                                type="button"
                                plain
                                className={scope === 'all' ? 'bg-zinc-950/5 dark:bg-white/10' : ''}
                                onClick={() => {
                                    setScope('all');
                                    void loadMedia(1, false, { scope: 'all', search, page: 1 });
                                }}
                            >
                                All
                            </Button>
                        </div>
                    ) : null}

                    <Button type="button" outline onClick={() => void loadMedia(1, false, currentQuery())}>
                        <MagnifyingGlassIcon data-slot="icon" />
                        Search
                    </Button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/gif,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0];

                            if (file) {
                                void handleUpload(file);
                            }

                            event.target.value = '';
                        }}
                    />
                    <Button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                        {uploading ? 'Uploading…' : 'Upload'}
                    </Button>
                </div>
            </div>

            {error ? <Text className="mt-4 text-sm text-red-600 dark:text-red-500">{error}</Text> : null}

            {loading ? (
                <Text className="mt-6 text-sm text-zinc-500">Loading media…</Text>
            ) : media.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-950/10 px-6 py-12 text-center dark:border-white/10">
                    <PhotoIcon className="size-10 text-zinc-400" />
                    <Text className="mt-3 text-sm text-zinc-500">No images found. Upload one to get started.</Text>
                </div>
            ) : (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {media.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className="group overflow-hidden rounded-lg border border-zinc-950/10 text-left transition hover:border-zinc-950/20 dark:border-white/10 dark:hover:border-white/20"
                            onClick={() => onSelect(item.url, item)}
                        >
                            <img
                                src={item.url}
                                alt={item.alt ?? item.original_name ?? item.filename}
                                className="aspect-square w-full object-cover transition group-hover:opacity-90"
                            />
                            <Description className="truncate px-2 py-1.5 text-xs">
                                {item.original_name ?? item.filename}
                            </Description>
                        </button>
                    ))}
                </div>
            )}

            {page < lastPage ? (
                <div className="mt-4 flex justify-center">
                    <Button
                        type="button"
                        outline
                        disabled={loadingMore}
                        onClick={() => void loadMedia(page + 1, true, currentQuery(page + 1))}
                    >
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
