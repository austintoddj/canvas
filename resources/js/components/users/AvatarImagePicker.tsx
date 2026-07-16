import { PhotoIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, Label } from '@/components/fieldset';
import ImageSourcePicker from '@/components/media/ImageSourcePicker';
import { useCanvas } from '@/hooks/useCanvas';

type AvatarImagePickerProps = {
    value: string;
    initials?: string;
    invalid?: boolean;
    error?: string;
    disabled?: boolean;
    onChange: (url: string) => void;
};

export function AvatarImagePicker({
    value,
    initials,
    invalid = false,
    error,
    disabled = false,
    onChange,
}: AvatarImagePickerProps) {
    const { t } = useCanvas();
    const [pickerOpen, setPickerOpen] = useState(false);
    const hasAvatar = value.trim() !== '';

    return (
        <Field>
            <Label>{t('profile.avatar')}</Label>
            <Description>{t('profile.avatar_help')}</Description>

            <div className="mt-3 flex items-center gap-4">
                <Avatar src={hasAvatar ? value.trim() : null} initials={initials} className="size-16" alt="" />
                <div className="flex min-w-0 flex-wrap gap-2">
                    <Button type="button" outline disabled={disabled} onClick={() => setPickerOpen(true)}>
                        {hasAvatar ? t('editor.change_image') : t('editor.choose_image')}
                    </Button>
                    {hasAvatar ? (
                        <Button
                            type="button"
                            plain
                            disabled={disabled}
                            onClick={() => onChange('')}
                            aria-label={t('profile.remove_avatar')}
                        >
                            <XMarkIcon data-slot="icon" />
                            {t('editor.remove')}
                        </Button>
                    ) : null}
                </div>
            </div>

            {!hasAvatar ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-zinc-950/10 bg-zinc-950/[0.01] px-3 py-2 text-sm text-canvas-muted dark:border-white/10 dark:bg-white/[0.02] dark:text-canvas-muted-dark">
                    <PhotoIcon className="size-4 shrink-0" aria-hidden="true" />
                    <span>{t('profile.avatar_empty')}</span>
                </div>
            ) : null}

            {invalid && error ? <ErrorMessage>{error}</ErrorMessage> : null}

            <ImageSourcePicker
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                title={t('profile.choose_avatar')}
                description={t('profile.avatar_help')}
                onSelect={(selection) => {
                    onChange(selection.url);
                    setPickerOpen(false);
                }}
            />
        </Field>
    );
}
