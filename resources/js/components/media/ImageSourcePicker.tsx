import { useEffect, useState } from 'react';

import { MediaPickerPanel } from '@/components/media/MediaPicker';
import { Button } from '@/components/button';
import { Dialog, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog';
import { Description, Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { ErrorText, Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { unsplashApi } from '@/lib/api/unsplash';
import { MEDIA_SEARCH_DEBOUNCE_MS } from '@/lib/media/list';
import type { Media, UnsplashPhoto } from '@/types/api';

type PickerTab = 'library' | 'unsplash';

export type ImageSourceSelection = {
    url: string;
    alt?: string | null;
    caption?: string | null;
    source: 'library' | 'unsplash';
    media?: Media;
    photo?: UnsplashPhoto;
};

type ImageSourcePickerProps = {
    open: boolean;
    onClose: () => void;
    onSelect: (selection: ImageSourceSelection) => void;
    title?: string;
    description?: string;
};

export default function ImageSourcePicker({
    open,
    onClose,
    onSelect,
    title = 'Choose image',
    description,
}: ImageSourcePickerProps) {
    const { boot } = useCanvas();
    const showUnsplash = boot.unsplash === true;

    const [activeTab, setActiveTab] = useState<PickerTab>('library');
    const [unsplashQuery, setUnsplashQuery] = useState('');
    const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
    const [unsplashLoading, setUnsplashLoading] = useState(false);
    const [unsplashError, setUnsplashError] = useState<string | null>(null);

    function resetUnsplash() {
        setUnsplashQuery('');
        setUnsplashResults([]);
        setUnsplashError(null);
        setUnsplashLoading(false);
    }

    function handleClose() {
        setActiveTab('library');
        resetUnsplash();
        onClose();
    }

    useEffect(() => {
        if (!open || activeTab !== 'unsplash') {
            return;
        }

        const query = unsplashQuery.trim();

        if (query === '') {
            setUnsplashResults([]);
            setUnsplashError(null);
            setUnsplashLoading(false);

            return;
        }

        const controller = new AbortController();
        let cancelled = false;

        const timer = setTimeout(() => {
            setUnsplashLoading(true);
            setUnsplashError(null);

            void unsplashApi
                .search({ query }, controller.signal)
                .then((response) => {
                    if (cancelled) {
                        return;
                    }

                    if ('error' in response) {
                        setUnsplashError(response.error);
                        setUnsplashResults([]);

                        return;
                    }

                    setUnsplashResults(response.results);
                })
                .catch(() => {
                    if (!cancelled && !controller.signal.aborted) {
                        setUnsplashError('Unable to search Unsplash.');
                        setUnsplashResults([]);
                    }
                })
                .finally(() => {
                    if (!cancelled) {
                        setUnsplashLoading(false);
                    }
                });
        }, MEDIA_SEARCH_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
            controller.abort();
        };
    }, [activeTab, open, unsplashQuery]);

    function selectLibrary(url: string, media?: Media) {
        onSelect({
            url,
            alt: media?.alt ?? media?.original_name ?? media?.filename ?? null,
            caption: media?.caption ?? media?.alt ?? null,
            source: 'library',
            media,
        });
        handleClose();
    }

    function selectUnsplash(photo: UnsplashPhoto) {
        onSelect({
            url: photo.urls.regular,
            alt: photo.alt_description ?? photo.description ?? `Photo by ${photo.user.name}`,
            caption: photo.alt_description ?? photo.description ?? `Photo by ${photo.user.name}`,
            source: 'unsplash',
            photo,
        });
        handleClose();
    }

    if (!showUnsplash) {
        return (
            <Dialog open={open} onClose={handleClose} size="4xl">
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description ?? 'Browse your media library.'}</DialogDescription>
                <DialogBody>
                    <MediaPickerPanel onSelect={selectLibrary} />
                </DialogBody>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={handleClose} size="4xl">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
                {description ?? 'Browse your media library or search Unsplash.'}
            </DialogDescription>

            <div className="mt-4 flex gap-2 border-b border-zinc-950/10 pb-3 dark:border-white/10">
                <Button
                    type="button"
                    plain
                    className={activeTab === 'library' ? 'bg-zinc-950/5 dark:bg-white/10' : ''}
                    onClick={() => setActiveTab('library')}
                >
                    Media library
                </Button>
                <Button
                    type="button"
                    plain
                    className={activeTab === 'unsplash' ? 'bg-zinc-950/5 dark:bg-white/10' : ''}
                    onClick={() => setActiveTab('unsplash')}
                >
                    Unsplash
                </Button>
            </div>

            <DialogBody>
                {activeTab === 'library' ? (
                    <MediaPickerPanel onSelect={selectLibrary} />
                ) : (
                    <div>
                        <Field>
                            <Label className="sr-only">Search Unsplash</Label>
                            <Input
                                name="unsplash-search"
                                value={unsplashQuery}
                                placeholder="Search Unsplash…"
                                onChange={(event) => setUnsplashQuery(event.target.value)}
                                autoFocus
                            />
                        </Field>

                        {unsplashError ? <ErrorText className="mt-4">{unsplashError}</ErrorText> : null}

                        {unsplashQuery.trim() === '' ? (
                            <Text className="mt-6 text-sm text-zinc-500">Start typing to search Unsplash.</Text>
                        ) : unsplashLoading ? (
                            <Text className="mt-6 text-sm text-zinc-500">Searching Unsplash…</Text>
                        ) : unsplashResults.length === 0 && unsplashError === null ? (
                            <Text className="mt-6 text-sm text-zinc-500">No photos found.</Text>
                        ) : (
                            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {unsplashResults.map((photo) => (
                                    <button
                                        key={photo.id}
                                        type="button"
                                        className="group overflow-hidden rounded-lg border border-zinc-950/10 text-left transition hover:border-zinc-950/20 dark:border-white/10"
                                        onClick={() => selectUnsplash(photo)}
                                    >
                                        <img
                                            src={photo.urls.small}
                                            alt={photo.alt_description ?? 'Unsplash photo'}
                                            className="aspect-square w-full object-cover transition group-hover:opacity-90"
                                        />
                                        <Description className="truncate px-2 py-1.5 text-xs">
                                            {photo.user.name}
                                        </Description>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </DialogBody>
        </Dialog>
    );
}
