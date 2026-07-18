import { useState } from 'react';

import ImageSourcePicker from '@/components/media/ImageSourcePicker';
import { Button } from '@/components/button';
import { Description, Field, Fieldset, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { resolveMediaUrl } from '@/lib/media/list';
import type { PostFormState } from '@/lib/posts/form';
import { IconPhoto } from '@tabler/icons-react';

type FeaturedImagePickerProps = {
    form: PostFormState;
    onChange: (form: PostFormState) => void;
    disabled?: boolean;
};

export default function FeaturedImagePicker({ form, onChange, disabled = false }: FeaturedImagePickerProps) {
    const { t } = useCanvas();
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
                        alt={form.featuredImageCaption ?? t('editor.featured_image')}
                        className="aspect-[1.91/1] w-full max-w-full object-cover"
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-950/10 bg-zinc-950/[0.01] px-4 py-8 text-center dark:border-white/10 dark:bg-white/[0.02]">
                    <IconPhoto className="size-8 text-zinc-400 dark:text-zinc-500" />
                    <Text className="mt-2 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                        {t('editor.no_featured_image')}
                    </Text>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <Button type="button" outline disabled={disabled} onClick={() => setPickerOpen(true)}>
                    {form.featuredImage ? t('editor.change_image') : t('editor.choose_image')}
                </Button>
                {form.featuredImage ? (
                    <Button type="button" plain disabled={disabled} onClick={removeImage}>
                        {t('editor.remove')}
                    </Button>
                ) : null}
            </div>

            <Field>
                <Label>{t('editor.image_caption')}</Label>
                <Description>{t('editor.image_caption_help')}</Description>
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
