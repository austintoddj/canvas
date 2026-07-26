import { useEffect, useState } from 'react';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/description-list';
import { Divider } from '@/components/divider';
import { ErrorMessage, Field, FieldGroup, Label } from '@/components/fieldset';
import { Subheading } from '@/components/heading';
import { Input } from '@/components/input';
import { SideDrawer } from '@/components/SideDrawer';
import { Text, ErrorText } from '@/components/text';
import { Textarea } from '@/components/textarea';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError } from '@/lib/api';
import { mediaApi } from '@/lib/api/media';
import {
    formatMediaBytes,
    formatMediaDate,
    formatMediaDimensions,
    mediaDisplayName,
    mediaMimeLabel,
} from '@/lib/media/list';
import { toast } from '@/lib/toast';
import type { Media, MediaUpdatePayload } from '@/types/api';

type MediaFormState = {
    original_name: string;
    alt: string;
    caption: string;
};

type MediaDetailDrawerProps = {
    open: boolean;
    mediaId: string | null;
    onClose: () => void;
    onUpdated?: (media: Media) => void;
    onDeleted?: (mediaId: string) => void;
};

function mediaToForm(media: Media): MediaFormState {
    return {
        original_name: media.original_name ?? '',
        alt: media.alt ?? '',
        caption: media.caption ?? '',
    };
}

function formToPayload(form: MediaFormState): MediaUpdatePayload {
    return {
        original_name: form.original_name.trim() === '' ? null : form.original_name.trim(),
        alt: form.alt.trim() === '' ? null : form.alt.trim(),
        caption: form.caption.trim() === '' ? null : form.caption.trim(),
    };
}

export function MediaDetailDrawer({ open, mediaId, onClose, onUpdated, onDeleted }: MediaDetailDrawerProps) {
    const { t } = useCanvas();
    const [media, setMedia] = useState<Media | null>(null);
    const [form, setForm] = useState<MediaFormState>({ original_name: '', alt: '', caption: '' });
    const [baseline, setBaseline] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const serialized = JSON.stringify(formToPayload(form));
    const isDirty = media !== null && serialized !== baseline;

    useEffect(() => {
        if (!open || mediaId === null) {
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        queueMicrotask(() => {
            if (!cancelled) {
                setLoading(true);
                setError(null);
                setFieldErrors({});
                setConfirmDeleteOpen(false);
                setDeleting(false);
                setMedia(null);
            }
        });

        mediaApi
            .show(mediaId, controller.signal)
            .then((item) => {
                if (cancelled) {
                    return;
                }

                const nextForm = mediaToForm(item);
                setMedia(item);
                setForm(nextForm);
                setBaseline(JSON.stringify(formToPayload(nextForm)));
            })
            .catch(() => {
                if (!cancelled) {
                    setError(t('media.load_item_error'));
                    setMedia(null);
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
    }, [open, mediaId, t]);

    async function handleSave() {
        if (mediaId === null || media === null) {
            return;
        }

        setSaving(true);
        setFieldErrors({});
        setError(null);

        try {
            const updated = await mediaApi.update(mediaId, formToPayload(form));
            const nextForm = mediaToForm(updated);
            setMedia(updated);
            setForm(nextForm);
            setBaseline(JSON.stringify(formToPayload(nextForm)));
            toast.success(t('media.saved'));
            onUpdated?.(updated);
        } catch (saveError) {
            if (saveError instanceof ValidationError) {
                setFieldErrors(saveError.errors);
                toast.error(t('common.please_fix_fields'));
            } else {
                setError(t('media.save_changes_error'));
                toast.error(t('media.save_changes_error'));
            }
        } finally {
            setSaving(false);
        }
    }

    function openDeleteConfirm() {
        if (deleting) {
            return;
        }

        setConfirmDeleteOpen(true);
    }

    function closeDeleteConfirm() {
        if (deleting) {
            return;
        }

        setConfirmDeleteOpen(false);
    }

    async function confirmDelete() {
        if (mediaId === null || media === null || deleting) {
            return;
        }

        setDeleting(true);
        setError(null);

        try {
            await mediaApi.destroy(mediaId);
            setConfirmDeleteOpen(false);
            toast.success(t('media.deleted'));
            onDeleted?.(mediaId);
            onClose();
        } catch {
            setDeleting(false);
            setConfirmDeleteOpen(false);
            toast.error(t('media.delete_error'));
        }
    }

    const mediaName = media ? mediaDisplayName(media) : t('media.this_image');
    const showFooter = media !== null && !loading;

    return (
        <>
            <SideDrawer
                open={open}
                onClose={onClose}
                title={media ? mediaDisplayName(media) : t('media.details_title')}
                closeLabel={t('media.close_details')}
                footer={
                    showFooter ? (
                        <>
                            <Button type="button" outline color="red" disabled={deleting} onClick={openDeleteConfirm}>
                                {t('common.delete')}
                            </Button>
                            <Button
                                type="button"
                                color="dark/zinc"
                                disabled={!isDirty || saving || deleting}
                                onClick={() => void handleSave()}
                            >
                                {saving ? t('common.saving') : t('common.save')}
                            </Button>
                        </>
                    ) : undefined
                }
            >
                {loading ? (
                    <div className="px-5 py-8">
                        <Text className="text-sm text-zinc-500">{t('media.loading')}</Text>
                    </div>
                ) : null}

                {!loading && error !== null && media === null ? (
                    <div className="px-5 py-8">
                        <ErrorText>{error}</ErrorText>
                    </div>
                ) : null}

                {!loading && media !== null ? (
                    <div className="flex flex-1 flex-col">
                        <div className="border-b border-zinc-950/5 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03]">
                            <img
                                src={media.url}
                                alt={media.alt ?? mediaDisplayName(media)}
                                className="max-h-64 w-full object-contain"
                            />
                        </div>

                        <div className="space-y-6 px-5 py-5">
                            {error ? <ErrorText>{error}</ErrorText> : null}

                            <div>
                                <Subheading>{t('common.details')}</Subheading>
                                <DescriptionList className="mt-3">
                                    <DescriptionTerm>{t('common.type')}</DescriptionTerm>
                                    <DescriptionDetails>{mediaMimeLabel(media.mime_type)}</DescriptionDetails>
                                    <DescriptionTerm>{t('media.size')}</DescriptionTerm>
                                    <DescriptionDetails>{formatMediaBytes(media.size)}</DescriptionDetails>
                                    <DescriptionTerm>{t('media.dimensions')}</DescriptionTerm>
                                    <DescriptionDetails>
                                        {formatMediaDimensions(media.width, media.height)}
                                    </DescriptionDetails>
                                    <DescriptionTerm>{t('media.uploaded')}</DescriptionTerm>
                                    <DescriptionDetails>{formatMediaDate(media.created_at)}</DescriptionDetails>
                                    {media.user?.name ? (
                                        <>
                                            <DescriptionTerm>{t('media.uploaded_by', 'Uploaded by')}</DescriptionTerm>
                                            <DescriptionDetails className="text-zinc-500 dark:text-zinc-400">
                                                {media.user.name}
                                            </DescriptionDetails>
                                        </>
                                    ) : null}
                                    <DescriptionTerm>{t('media.filename')}</DescriptionTerm>
                                    <DescriptionDetails className="break-all">{media.filename}</DescriptionDetails>
                                </DescriptionList>
                            </div>

                            <Divider />

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void handleSave();
                                }}
                            >
                                <Subheading>{t('media.metadata')}</Subheading>
                                <FieldGroup className="mt-3">
                                    <Field>
                                        <Label>{t('media.display_name')}</Label>
                                        <Input
                                            name="original_name"
                                            value={form.original_name}
                                            onChange={(event) => {
                                                setForm((current) => ({
                                                    ...current,
                                                    original_name: event.target.value,
                                                }));
                                            }}
                                            invalid={Boolean(fieldErrors.original_name)}
                                        />
                                        {fieldErrors.original_name?.[0] ? (
                                            <ErrorMessage>{fieldErrors.original_name[0]}</ErrorMessage>
                                        ) : null}
                                    </Field>
                                    <Field>
                                        <Label>{t('media.alt_text')}</Label>
                                        <Input
                                            name="alt"
                                            value={form.alt}
                                            onChange={(event) => {
                                                setForm((current) => ({
                                                    ...current,
                                                    alt: event.target.value,
                                                }));
                                            }}
                                            invalid={Boolean(fieldErrors.alt)}
                                        />
                                        {fieldErrors.alt?.[0] ? (
                                            <ErrorMessage>{fieldErrors.alt[0]}</ErrorMessage>
                                        ) : null}
                                    </Field>
                                    <Field>
                                        <Label>{t('media.caption')}</Label>
                                        <Textarea
                                            name="caption"
                                            rows={3}
                                            value={form.caption}
                                            onChange={(event) => {
                                                setForm((current) => ({
                                                    ...current,
                                                    caption: event.target.value,
                                                }));
                                            }}
                                            invalid={Boolean(fieldErrors.caption)}
                                        />
                                        {fieldErrors.caption?.[0] ? (
                                            <ErrorMessage>{fieldErrors.caption[0]}</ErrorMessage>
                                        ) : null}
                                    </Field>
                                </FieldGroup>
                            </form>
                        </div>
                    </div>
                ) : null}
            </SideDrawer>

            <Alert open={confirmDeleteOpen} onClose={closeDeleteConfirm} size="sm">
                <AlertTitle>{t('media.delete_title')}</AlertTitle>
                <AlertDescription>{t('media.delete_confirm_body', { name: mediaName })}</AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={deleting} onClick={closeDeleteConfirm}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="button" color="red" disabled={deleting} onClick={() => void confirmDelete()}>
                        {deleting ? t('common.deleting') : t('common.delete')}
                    </Button>
                </AlertActions>
            </Alert>
        </>
    );
}
