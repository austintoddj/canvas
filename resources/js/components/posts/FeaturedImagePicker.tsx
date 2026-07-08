import { PhotoIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

import MediaPicker, { MediaPickerPanel } from '@/components/media/MediaPicker';
import { Button } from '@/components/button';
import { Dialog, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog';
import { Description, Field, Fieldset, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Text } from '@/components/text';
import { unsplashApi } from '@/lib/api/unsplash';
import type { PostFormState } from '@/lib/posts/form';
import type { UnsplashPhoto } from '@/types/api';

type FeaturedImagePickerProps = {
    form: PostFormState;
    onChange: (form: PostFormState) => void;
    disabled?: boolean;
};

type PickerTab = 'library' | 'unsplash';

function unsplashEnabled(): boolean {
    const key = window.Canvas?.unsplash;

    return key != null && key.trim() !== '';
}

export default function FeaturedImagePicker({ form, onChange, disabled = false }: FeaturedImagePickerProps) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<PickerTab>('library');
    const [unsplashQuery, setUnsplashQuery] = useState('');
    const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
    const [unsplashLoading, setUnsplashLoading] = useState(false);
    const [unsplashError, setUnsplashError] = useState<string | null>(null);

    const showUnsplash = unsplashEnabled();

    function openPicker() {
        setActiveTab('library');
        setUnsplashQuery('');
        setUnsplashResults([]);
        setUnsplashError(null);
        setPickerOpen(true);
    }

    function selectImage(url: string, caption?: string | null) {
        onChange({
            ...form,
            featuredImage: url,
            featuredImageCaption: caption ?? form.featuredImageCaption,
        });
        setPickerOpen(false);
    }

    function removeImage() {
        onChange({
            ...form,
            featuredImage: null,
            featuredImageCaption: null,
        });
    }

    async function searchUnsplash() {
        setUnsplashLoading(true);
        setUnsplashError(null);

        try {
            const response = await unsplashApi.search({ query: unsplashQuery.trim() });

            if ('error' in response) {
                setUnsplashError(response.error);
                setUnsplashResults([]);
                return;
            }

            setUnsplashResults(response.results);
        } catch {
            setUnsplashError('Unable to search Unsplash.');
            setUnsplashResults([]);
        } finally {
            setUnsplashLoading(false);
        }
    }

    return (
        <Fieldset className="space-y-4">
            {form.featuredImage ? (
                <div className="overflow-hidden rounded-lg border border-zinc-950/10 dark:border-white/10">
                    <img
                        src={form.featuredImage}
                        alt={form.featuredImageCaption ?? 'Featured image'}
                        className="aspect-[1.91/1] w-full object-cover"
                    />
                    <div className="flex items-center justify-between gap-2 p-3">
                        <Text className="truncate text-sm text-zinc-600 dark:text-zinc-300">Featured image</Text>
                        <Button
                            type="button"
                            plain
                            disabled={disabled}
                            onClick={removeImage}
                            aria-label="Remove featured image"
                        >
                            <XMarkIcon data-slot="icon" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-950/10 px-4 py-8 text-center dark:border-white/10">
                    <PhotoIcon className="size-8 text-zinc-400" />
                    <Text className="mt-2 text-sm text-zinc-500">No featured image selected</Text>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <Button type="button" outline disabled={disabled} onClick={openPicker}>
                    {form.featuredImage ? 'Change image' : 'Choose image'}
                </Button>
                {form.featuredImage ? (
                    <Button type="button" plain disabled={disabled} onClick={removeImage}>
                        Remove
                    </Button>
                ) : null}
            </div>

            <Field>
                <Label>Image caption</Label>
                <Description>Used as alt text and in social previews.</Description>
                <Input
                    name="featured_image_caption"
                    value={form.featuredImageCaption ?? ''}
                    disabled={disabled || form.featuredImage === null}
                    onChange={(event) =>
                        onChange({
                            ...form,
                            featuredImageCaption: event.target.value === '' ? null : event.target.value,
                        })
                    }
                />
            </Field>

            {showUnsplash ? (
                <TabbedImagePickerDialog
                    open={pickerOpen}
                    activeTab={activeTab}
                    unsplashQuery={unsplashQuery}
                    unsplashResults={unsplashResults}
                    unsplashLoading={unsplashLoading}
                    unsplashError={unsplashError}
                    onClose={() => setPickerOpen(false)}
                    onTabChange={setActiveTab}
                    onUnsplashQueryChange={setUnsplashQuery}
                    onSearchUnsplash={() => void searchUnsplash()}
                    onSelectLibrary={(url, media) => selectImage(url, media?.caption ?? media?.alt ?? null)}
                    onSelectUnsplash={(photo) =>
                        selectImage(
                            photo.urls.regular,
                            photo.alt_description ?? photo.description ?? `Photo by ${photo.user.name}`
                        )
                    }
                />
            ) : (
                <MediaPicker
                    open={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    onSelect={(url, media) => selectImage(url, media?.caption ?? media?.alt ?? null)}
                />
            )}
        </Fieldset>
    );
}

type TabbedImagePickerDialogProps = {
    open: boolean;
    activeTab: PickerTab;
    unsplashQuery: string;
    unsplashResults: UnsplashPhoto[];
    unsplashLoading: boolean;
    unsplashError: string | null;
    onClose: () => void;
    onTabChange: (tab: PickerTab) => void;
    onUnsplashQueryChange: (value: string) => void;
    onSearchUnsplash: () => void;
    onSelectLibrary: (url: string, media?: { caption?: string | null; alt?: string | null }) => void;
    onSelectUnsplash: (photo: UnsplashPhoto) => void;
};

function TabbedImagePickerDialog({
    open,
    activeTab,
    unsplashQuery,
    unsplashResults,
    unsplashLoading,
    unsplashError,
    onClose,
    onTabChange,
    onUnsplashQueryChange,
    onSearchUnsplash,
    onSelectLibrary,
    onSelectUnsplash,
}: TabbedImagePickerDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} size="4xl">
            <DialogTitle>Choose image</DialogTitle>
            <DialogDescription>Browse your media library or search Unsplash.</DialogDescription>

            <div className="mt-4 flex gap-2 border-b border-zinc-950/10 pb-3 dark:border-white/10">
                <Button
                    type="button"
                    plain
                    className={activeTab === 'library' ? 'bg-zinc-950/5 dark:bg-white/10' : ''}
                    onClick={() => onTabChange('library')}
                >
                    Media library
                </Button>
                <Button
                    type="button"
                    plain
                    className={activeTab === 'unsplash' ? 'bg-zinc-950/5 dark:bg-white/10' : ''}
                    onClick={() => onTabChange('unsplash')}
                >
                    Unsplash
                </Button>
            </div>

            <DialogBody>
                {activeTab === 'library' ? (
                    <MediaPickerPanel onSelect={onSelectLibrary} />
                ) : (
                    <div>
                        <div className="flex flex-wrap items-end gap-3">
                            <Field className="min-w-[12rem] flex-1">
                                <Label className="sr-only">Search Unsplash</Label>
                                <Input
                                    name="unsplash-search"
                                    value={unsplashQuery}
                                    placeholder="Search Unsplash…"
                                    onChange={(event) => onUnsplashQueryChange(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            onSearchUnsplash();
                                        }
                                    }}
                                />
                            </Field>
                            <Button type="button" outline onClick={onSearchUnsplash}>
                                Search
                            </Button>
                        </div>

                        {unsplashError ? (
                            <Text className="mt-4 text-sm text-red-600 dark:text-red-500">{unsplashError}</Text>
                        ) : null}

                        {unsplashLoading ? (
                            <Text className="mt-6 text-sm text-zinc-500">Searching Unsplash…</Text>
                        ) : unsplashResults.length === 0 ? (
                            <Text className="mt-6 text-sm text-zinc-500">Search for photos on Unsplash.</Text>
                        ) : (
                            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {unsplashResults.map((photo) => (
                                    <button
                                        key={photo.id}
                                        type="button"
                                        className="group overflow-hidden rounded-lg border border-zinc-950/10 text-left transition hover:border-zinc-950/20 dark:border-white/10"
                                        onClick={() => onSelectUnsplash(photo)}
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
