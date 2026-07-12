import { PhotoIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

import ImageSourcePicker from '@/components/media/ImageSourcePicker';
import { Button } from '@/components/button';
import { Description, Field, Fieldset, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Text } from '@/components/text';
import { resolveMediaUrl } from '@/lib/media/list';
import type { PostFormState } from '@/lib/posts/form';

type FeaturedImagePickerProps = {
    form: PostFormState;
    onChange: (form: PostFormState) => void;
    disabled?: boolean;
};

export default function FeaturedImagePicker({ form, onChange, disabled = false }: FeaturedImagePickerProps) {
    const [pickerOpen, setPickerOpen] = useState(false);

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

    return (
        <Fieldset className="space-y-4">
            {form.featuredImage ? (
                <div className="min-w-0 overflow-hidden rounded-lg border border-zinc-950/10 dark:border-white/10 dark:ring-1 dark:ring-white/5">
                    <img
                        src={resolveMediaUrl(form.featuredImage)}
                        alt={form.featuredImageCaption ?? 'Featured image'}
                        className="aspect-[1.91/1] w-full max-w-full object-cover"
                    />
                    <div className="flex items-center justify-between gap-2 p-3 dark:bg-white/[0.02]">
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
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-950/10 bg-zinc-950/[0.01] px-4 py-8 text-center dark:border-white/10 dark:bg-white/[0.02]">
                    <PhotoIcon className="size-8 text-zinc-400 dark:text-zinc-500" />
                    <Text className="mt-2 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                        No featured image selected
                    </Text>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <Button type="button" outline disabled={disabled} onClick={() => setPickerOpen(true)}>
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

            <ImageSourcePicker
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(selection) => selectImage(selection.url, selection.caption)}
            />
        </Fieldset>
    );
}
