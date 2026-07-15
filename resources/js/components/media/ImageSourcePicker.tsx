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

export default function ImageSourcePicker({ open, onClose, onSelect, title, description }: ImageSourcePickerProps) {
    const { boot, t } = useCanvas();
    const showUnsplash = boot.unsplash === true;
    const resolvedTitle = title ?? t('editor.choose_image');
    const resolvedDescription = description ?? t('media.browse');

    const [activeTab, setActiveTab] = useState<PickerTab>('library');
    const [unsplashQuery, setUnsplashQuery] = useState('');
    const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
    const [unsplashPage, setUnsplashPage] = useState(1);
    const [unsplashTotalPages, setUnsplashTotalPages] = useState(1);
    const [unsplashLoading, setUnsplashLoading] = useState(false);
    const [unsplashLoadingMore, setUnsplashLoadingMore] = useState(false);
    const [unsplashError, setUnsplashError] = useState<string | null>(null);

    function resetUnsplash() {
        setUnsplashQuery('');
        setUnsplashResults([]);
        setUnsplashPage(1);
        setUnsplashTotalPages(1);
        setUnsplashError(null);
        setUnsplashLoading(false);
        setUnsplashLoadingMore(false);
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
        let cancelled = false;

        if (query === '') {
            queueMicrotask(() => {
                if (!cancelled) {
                    setUnsplashResults([]);
                    setUnsplashPage(1);
                    setUnsplashTotalPages(1);
                    setUnsplashError(null);
                    setUnsplashLoading(false);
                    setUnsplashLoadingMore(false);
                }
            });

            return () => {
                cancelled = true;
            };
        }

        const controller = new AbortController();

        const timer = setTimeout(() => {
            setUnsplashLoading(true);
            setUnsplashError(null);
            setUnsplashLoadingMore(false);

            void unsplashApi
                .search({ query, page: 1 }, controller.signal)
                .then((response) => {
                    if (cancelled) {
                        return;
                    }

                    if ('error' in response) {
                        setUnsplashError(response.error);
                        setUnsplashResults([]);
                        setUnsplashPage(1);
                        setUnsplashTotalPages(1);

                        return;
                    }

                    setUnsplashResults(response.results);
                    setUnsplashPage(1);
                    setUnsplashTotalPages(response.total_pages ?? 1);
                })
                .catch(() => {
                    if (!cancelled && !controller.signal.aborted) {
                        setUnsplashError(t('unsplash.search_error'));
                        setUnsplashResults([]);
                        setUnsplashPage(1);
                        setUnsplashTotalPages(1);
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
    }, [activeTab, open, unsplashQuery, t]);

    async function loadMoreUnsplash() {
        const query = unsplashQuery.trim();

        if (unsplashLoadingMore || unsplashLoading || query === '' || unsplashPage >= unsplashTotalPages) {
            return;
        }

        const nextPage = unsplashPage + 1;

        setUnsplashLoadingMore(true);
        setUnsplashError(null);

        try {
            const response = await unsplashApi.search({ query, page: nextPage });

            if ('error' in response) {
                setUnsplashError(response.error);

                return;
            }

            setUnsplashResults((current) => {
                const seen = new Set(current.map((photo) => photo.id));

                return [...current, ...response.results.filter((photo) => !seen.has(photo.id))];
            });
            setUnsplashPage(nextPage);
            setUnsplashTotalPages(response.total_pages ?? nextPage);
        } catch {
            setUnsplashError(t('unsplash.load_more_error'));
        } finally {
            setUnsplashLoadingMore(false);
        }
    }

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
                <DialogTitle>{resolvedTitle}</DialogTitle>
                <DialogDescription>{resolvedDescription}</DialogDescription>
                <DialogBody>
                    <MediaPickerPanel onSelect={selectLibrary} />
                </DialogBody>
            </Dialog>
        );
    }

    const canLoadMoreUnsplash =
        unsplashQuery.trim() !== '' &&
        !unsplashLoading &&
        unsplashResults.length > 0 &&
        unsplashPage < unsplashTotalPages;

    return (
        <Dialog open={open} onClose={handleClose} size="4xl">
            <DialogTitle>{resolvedTitle}</DialogTitle>
            <DialogDescription>{resolvedDescription}</DialogDescription>

            <div className="mt-4 flex gap-2 border-b border-zinc-950/10 pb-3 dark:border-white/10">
                <Button
                    type="button"
                    plain
                    className={activeTab === 'library' ? 'bg-zinc-950/5 dark:bg-white/10' : ''}
                    onClick={() => setActiveTab('library')}
                >
                    {t('media.title')}
                </Button>
                <Button
                    type="button"
                    plain
                    className={activeTab === 'unsplash' ? 'bg-zinc-950/5 dark:bg-white/10' : ''}
                    onClick={() => setActiveTab('unsplash')}
                >
                    {t('integrations.unsplash')}
                </Button>
            </div>

            <DialogBody>
                {activeTab === 'library' ? (
                    <MediaPickerPanel onSelect={selectLibrary} />
                ) : (
                    <div>
                        <Field>
                            <Label className="sr-only">{t('unsplash.title')}</Label>
                            <Input
                                name="unsplash-search"
                                value={unsplashQuery}
                                placeholder={t('unsplash.placeholder')}
                                onChange={(event) => setUnsplashQuery(event.target.value)}
                                // eslint-disable-next-line jsx-a11y/no-autofocus -- focus search when Unsplash tab is open
                                autoFocus
                            />
                        </Field>

                        {unsplashError ? <ErrorText className="mt-4">{unsplashError}</ErrorText> : null}

                        {unsplashQuery.trim() === '' ? (
                            <Text className="mt-6 text-sm text-zinc-500">{t('unsplash.start')}</Text>
                        ) : unsplashLoading && unsplashResults.length === 0 ? (
                            <Text className="mt-6 text-sm text-zinc-500">{t('unsplash.searching')}</Text>
                        ) : unsplashResults.length === 0 && unsplashError === null ? (
                            <Text className="mt-6 text-sm text-zinc-500">{t('unsplash.none')}</Text>
                        ) : (
                            <>
                                <div
                                    className={
                                        unsplashLoading
                                            ? 'mt-6 grid grid-cols-2 gap-3 opacity-50 transition-opacity duration-200 sm:grid-cols-3 md:grid-cols-4'
                                            : 'mt-6 grid grid-cols-2 gap-3 transition-opacity duration-200 sm:grid-cols-3 md:grid-cols-4'
                                    }
                                    aria-busy={unsplashLoading || unsplashLoadingMore || undefined}
                                >
                                    {unsplashResults.map((photo) => (
                                        <button
                                            key={photo.id}
                                            type="button"
                                            className="group overflow-hidden rounded-lg border border-zinc-950/10 text-left transition hover:border-zinc-950/20 dark:border-white/10"
                                            onClick={() => selectUnsplash(photo)}
                                        >
                                            <img
                                                src={photo.urls.small}
                                                alt={photo.alt_description ?? t('unsplash.photo')}
                                                className="aspect-square w-full object-cover transition group-hover:opacity-90"
                                            />
                                            <Description className="truncate px-2 py-1.5 text-xs">
                                                {photo.user.name}
                                            </Description>
                                        </button>
                                    ))}
                                </div>

                                {canLoadMoreUnsplash ? (
                                    <div className="mt-4 flex justify-center">
                                        <Button
                                            type="button"
                                            outline
                                            disabled={unsplashLoadingMore}
                                            onClick={() => void loadMoreUnsplash()}
                                        >
                                            {unsplashLoadingMore ? t('common.loading') : t('unsplash.load_more')}
                                        </Button>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                )}
            </DialogBody>
        </Dialog>
    );
}
