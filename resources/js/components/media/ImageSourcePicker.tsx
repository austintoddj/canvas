import { useEffect, useMemo, useRef, useState } from 'react';

import { FadeInImage } from '@/components/FadeInImage';
import { JustifiedMediaGrid } from '@/components/media/JustifiedMediaGrid';
import { MediaPickerPanel } from '@/components/media/MediaPicker';
import { Button } from '@/components/button';
import { Dialog, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog';
import { Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { ErrorText, Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { unsplashApi } from '@/lib/api/unsplash';
import { unsplashPerPage, unsplashTargetRowHeight, type UnsplashGridDensity } from '@/lib/media/layout';
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
    const [unsplashDensity, setUnsplashDensity] = useState<UnsplashGridDensity>('large');
    const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
    const [unsplashPage, setUnsplashPage] = useState(1);
    const [unsplashTotalPages, setUnsplashTotalPages] = useState(1);
    const [unsplashLoading, setUnsplashLoading] = useState(false);
    const [unsplashLoadingMore, setUnsplashLoadingMore] = useState(false);
    const [unsplashError, setUnsplashError] = useState<string | null>(null);
    const previousUnsplashQueryRef = useRef(unsplashQuery);

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
        const perPage = unsplashPerPage(unsplashDensity);

        function runSearch(): void {
            setUnsplashLoading(true);
            setUnsplashError(null);
            setUnsplashLoadingMore(false);

            void unsplashApi
                .search({ query, page: 1, per_page: perPage }, controller.signal)
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
        }

        const queryChanged = previousUnsplashQueryRef.current !== unsplashQuery;
        previousUnsplashQueryRef.current = unsplashQuery;
        const delay = queryChanged ? MEDIA_SEARCH_DEBOUNCE_MS : 0;

        const timer = setTimeout(runSearch, delay);

        return () => {
            cancelled = true;
            clearTimeout(timer);
            controller.abort();
        };
    }, [activeTab, open, unsplashQuery, unsplashDensity, t]);

    async function loadMoreUnsplash() {
        const query = unsplashQuery.trim();

        if (unsplashLoadingMore || unsplashLoading || query === '' || unsplashPage >= unsplashTotalPages) {
            return;
        }

        const nextPage = unsplashPage + 1;

        setUnsplashLoadingMore(true);
        setUnsplashError(null);

        try {
            const response = await unsplashApi.search({
                query,
                page: nextPage,
                per_page: unsplashPerPage(unsplashDensity),
            });

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

    function unsplashCredit(photo: UnsplashPhoto): string {
        return photo.alt_description ?? photo.description ?? t('unsplash.photo_by', { name: photo.user.name });
    }

    function selectUnsplash(photo: UnsplashPhoto) {
        const credit = unsplashCredit(photo);

        onSelect({
            url: photo.urls.regular,
            alt: credit,
            caption: credit,
            source: 'unsplash',
            photo,
        });
        handleClose();
    }

    const unsplashJustifiedItems = useMemo(
        () =>
            unsplashResults.map((photo) => ({
                id: photo.id,
                width: photo.width,
                height: photo.height,
            })),
        [unsplashResults]
    );

    const unsplashById = useMemo(() => {
        const map = new Map<string, UnsplashPhoto>();

        for (const photo of unsplashResults) {
            map.set(photo.id, photo);
        }

        return map;
    }, [unsplashResults]);

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

    const thumbUrl = (photo: UnsplashPhoto) => (unsplashDensity === 'large' ? photo.urls.regular : photo.urls.small);

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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Field className="min-w-0 flex-1">
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
                            <PillNav
                                value={unsplashDensity}
                                onChange={setUnsplashDensity}
                                aria-label={t('unsplash.size')}
                                className="shrink-0 self-start sm:self-auto"
                            >
                                <PillNavItem value="small">{t('unsplash.size_small')}</PillNavItem>
                                <PillNavItem value="large">{t('unsplash.size_large')}</PillNavItem>
                            </PillNav>
                        </div>

                        {unsplashError ? <ErrorText className="mt-4">{unsplashError}</ErrorText> : null}

                        {unsplashQuery.trim() === '' ? (
                            <Text className="mt-6 text-sm text-zinc-500">{t('unsplash.start')}</Text>
                        ) : unsplashLoading && unsplashResults.length === 0 ? (
                            <Text className="mt-6 text-sm text-zinc-500">{t('unsplash.searching')}</Text>
                        ) : unsplashResults.length === 0 && unsplashError === null ? (
                            <Text className="mt-6 text-sm text-zinc-500">{t('unsplash.none')}</Text>
                        ) : (
                            <>
                                <JustifiedMediaGrid
                                    className={
                                        unsplashLoading
                                            ? 'mt-6 opacity-50 transition-opacity duration-200'
                                            : 'mt-6 transition-opacity duration-200'
                                    }
                                    items={unsplashJustifiedItems}
                                    targetRowHeight={unsplashTargetRowHeight(unsplashDensity)}
                                    aria-busy={unsplashLoading || unsplashLoadingMore || undefined}
                                    renderTile={(tile) => {
                                        const photo = unsplashById.get(tile.id);

                                        if (photo === undefined) {
                                            return null;
                                        }

                                        const credit = unsplashCredit(photo);

                                        return (
                                            <button
                                                type="button"
                                                className="group size-full overflow-hidden rounded-lg border border-zinc-950/10 text-left transition hover:border-zinc-950/20 focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-white/10"
                                                title={credit}
                                                aria-label={credit}
                                                onClick={() => selectUnsplash(photo)}
                                            >
                                                <FadeInImage
                                                    src={thumbUrl(photo)}
                                                    alt={credit}
                                                    className="size-full object-cover transition group-hover:opacity-90"
                                                />
                                            </button>
                                        );
                                    }}
                                />

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
