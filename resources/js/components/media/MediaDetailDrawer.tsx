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
import { ValidationError } from '@/lib/api';
import { mediaApi } from '@/lib/api/media';
import {
    formatMediaBytes,
    formatMediaDate,
    formatMediaDimensions,
    mediaDisplayName,
    mediaMimeLabel,
    resolveMediaUrl,
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
    const [media, setMedia] = useState<Media | null>(null);
    const [form, setForm] = useState<MediaFormState>({ original_name: '', alt: '', caption: '' });
    const [baseline, setBaseline] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
                setSaveMessage(null);
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
                    setError('Unable to load this media item.');
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
    }, [open, mediaId]);

    async function handleSave() {
        if (mediaId === null || media === null) {
            return;
        }

        setSaving(true);
        setFieldErrors({});
        setSaveMessage(null);
        setError(null);

        try {
            const updated = await mediaApi.update(mediaId, formToPayload(form));
            const nextForm = mediaToForm(updated);
            setMedia(updated);
            setForm(nextForm);
            setBaseline(JSON.stringify(formToPayload(nextForm)));
            setSaveMessage('Saved');
            onUpdated?.(updated);
        } catch (saveError) {
            if (saveError instanceof ValidationError) {
                setFieldErrors(saveError.errors);
                setError('Please fix the highlighted fields.');
            } else {
                setError('Unable to save changes.');
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
            toast.success('Image deleted.');
            onDeleted?.(mediaId);
            onClose();
        } catch {
            setDeleting(false);
            setConfirmDeleteOpen(false);
            toast.error('Unable to delete this media item.');
        }
    }

    const mediaName = media ? mediaDisplayName(media) : 'this image';
    const showFooter = media !== null && !loading;

    return (
        <>
            <SideDrawer
                open={open}
                onClose={onClose}
                title={media ? mediaDisplayName(media) : 'Media details'}
                description="Edit metadata or remove from the library"
                closeLabel="Close media details"
                footer={
                    showFooter ? (
                        <>
                            <Button type="button" outline color="red" disabled={deleting} onClick={openDeleteConfirm}>
                                Delete
                            </Button>
                            <div className="flex flex-wrap items-center gap-2">
                                {saveMessage && !isDirty ? (
                                    <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                        {saveMessage}
                                    </Text>
                                ) : null}
                                <Button
                                    type="button"
                                    color="dark/zinc"
                                    disabled={!isDirty || saving || deleting}
                                    onClick={() => void handleSave()}
                                >
                                    {saving ? 'Saving…' : 'Save'}
                                </Button>
                            </div>
                        </>
                    ) : undefined
                }
            >
                {loading ? (
                    <div className="px-5 py-8">
                        <Text className="text-sm text-zinc-500">Loading media…</Text>
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
                                src={resolveMediaUrl(media.url)}
                                alt={media.alt ?? mediaDisplayName(media)}
                                className="max-h-64 w-full object-contain"
                            />
                        </div>

                        <div className="space-y-6 px-5 py-5">
                            {error ? <ErrorText>{error}</ErrorText> : null}

                            <div>
                                <Subheading>Details</Subheading>
                                <DescriptionList className="mt-3">
                                    <DescriptionTerm>Type</DescriptionTerm>
                                    <DescriptionDetails>{mediaMimeLabel(media.mime_type)}</DescriptionDetails>
                                    <DescriptionTerm>Size</DescriptionTerm>
                                    <DescriptionDetails>{formatMediaBytes(media.size)}</DescriptionDetails>
                                    <DescriptionTerm>Dimensions</DescriptionTerm>
                                    <DescriptionDetails>
                                        {formatMediaDimensions(media.width, media.height)}
                                    </DescriptionDetails>
                                    <DescriptionTerm>Uploaded</DescriptionTerm>
                                    <DescriptionDetails>{formatMediaDate(media.created_at)}</DescriptionDetails>
                                    <DescriptionTerm>Filename</DescriptionTerm>
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
                                <Subheading>Metadata</Subheading>
                                <FieldGroup className="mt-3">
                                    <Field>
                                        <Label>Display name</Label>
                                        <Input
                                            name="original_name"
                                            value={form.original_name}
                                            onChange={(event) => {
                                                setForm((current) => ({
                                                    ...current,
                                                    original_name: event.target.value,
                                                }));
                                                setSaveMessage(null);
                                            }}
                                            invalid={Boolean(fieldErrors.original_name)}
                                        />
                                        {fieldErrors.original_name?.[0] ? (
                                            <ErrorMessage>{fieldErrors.original_name[0]}</ErrorMessage>
                                        ) : null}
                                    </Field>
                                    <Field>
                                        <Label>Alt text</Label>
                                        <Input
                                            name="alt"
                                            value={form.alt}
                                            onChange={(event) => {
                                                setForm((current) => ({
                                                    ...current,
                                                    alt: event.target.value,
                                                }));
                                                setSaveMessage(null);
                                            }}
                                            invalid={Boolean(fieldErrors.alt)}
                                        />
                                        {fieldErrors.alt?.[0] ? (
                                            <ErrorMessage>{fieldErrors.alt[0]}</ErrorMessage>
                                        ) : null}
                                    </Field>
                                    <Field>
                                        <Label>Caption</Label>
                                        <Textarea
                                            name="caption"
                                            rows={3}
                                            value={form.caption}
                                            onChange={(event) => {
                                                setForm((current) => ({
                                                    ...current,
                                                    caption: event.target.value,
                                                }));
                                                setSaveMessage(null);
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
                <AlertTitle>Delete image?</AlertTitle>
                <AlertDescription>Delete “{mediaName}”? This cannot be undone.</AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={deleting} onClick={closeDeleteConfirm}>
                        Cancel
                    </Button>
                    <Button type="button" color="red" disabled={deleting} onClick={() => void confirmDelete()}>
                        {deleting ? 'Deleting…' : 'Delete'}
                    </Button>
                </AlertActions>
            </Alert>
        </>
    );
}
