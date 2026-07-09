import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/button';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/description-list';
import { Divider } from '@/components/divider';
import { ErrorMessage, Field, FieldGroup, Label } from '@/components/fieldset';
import { Heading, Subheading } from '@/components/heading';
import { Input } from '@/components/input';
import { Text } from '@/components/text';
import { Textarea } from '@/components/textarea';
import { ValidationError } from '@/lib/api';
import { mediaApi } from '@/lib/api/media';
import {
    formatMediaBytes,
    formatMediaDate,
    formatMediaDimensions,
    mediaDisplayName,
    mediaMimeLabel,
} from '@/lib/media/list';
import type { Media, MediaUpdatePayload } from '@/types/api';

type MediaFormState = {
    original_name: string;
    alt: string;
    caption: string;
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

export default function MediaShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const mediaId = id ?? null;

    const [media, setMedia] = useState<Media | null>(null);
    const [form, setForm] = useState<MediaFormState>({ original_name: '', alt: '', caption: '' });
    const [baseline, setBaseline] = useState('');
    const [loading, setLoading] = useState(mediaId !== null);
    const [error, setError] = useState<string | null>(mediaId === null ? 'Media not found.' : null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const serialized = JSON.stringify(formToPayload(form));
    const isDirty = media !== null && serialized !== baseline;

    useEffect(() => {
        if (mediaId === null) {
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        queueMicrotask(() => {
            if (!cancelled) {
                setLoading(true);
                setError(null);
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
    }, [mediaId]);

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

    async function handleDelete() {
        if (mediaId === null || media === null) {
            return;
        }

        const name = mediaDisplayName(media);
        const confirmed = window.confirm(`Delete “${name}”? This cannot be undone.`);

        if (!confirmed) {
            return;
        }

        setDeleting(true);
        setError(null);

        try {
            await mediaApi.destroy(mediaId);
            navigate('/media');
        } catch {
            setError('Unable to delete this media item.');
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <Text className="text-sm text-zinc-500">Loading media…</Text>
            </div>
        );
    }

    if (error !== null && media === null) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <Button href="/media" plain>
                    <ArrowLeftIcon data-slot="icon" />
                    Media
                </Button>
                <Text className="mt-6 text-sm text-red-600 dark:text-red-500">{error}</Text>
            </div>
        );
    }

    if (media === null) {
        return null;
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Button href="/media" plain>
                        <ArrowLeftIcon data-slot="icon" />
                        Media
                    </Button>
                    <Heading className="mt-4">{mediaDisplayName(media)}</Heading>
                    <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Update alt text, caption, and display name
                    </Text>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {saveMessage && !isDirty ? (
                        <Text className="text-sm text-zinc-500 dark:text-zinc-400">{saveMessage}</Text>
                    ) : null}
                    <Button type="button" color="dark/zinc" disabled={!isDirty || saving} onClick={() => void handleSave()}>
                        {saving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button type="button" outline disabled={deleting} onClick={() => void handleDelete()}>
                        <TrashIcon data-slot="icon" />
                        {deleting ? 'Deleting…' : 'Delete'}
                    </Button>
                </div>
            </div>

            {error ? <Text className="mt-6 text-sm text-red-600 dark:text-red-500">{error}</Text> : null}

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-zinc-950/10 dark:border-white/10">
                    <img
                        src={media.url}
                        alt={media.alt ?? mediaDisplayName(media)}
                        className="max-h-[28rem] w-full object-contain bg-zinc-50 dark:bg-zinc-900"
                    />
                </div>

                <div className="space-y-8">
                    <div>
                        <Subheading>Details</Subheading>
                        <DescriptionList className="mt-4">
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
                        <FieldGroup className="mt-4">
                            <Field>
                                <Label>Display name</Label>
                                <Input
                                    name="original_name"
                                    value={form.original_name}
                                    onChange={(event) => {
                                        setForm((current) => ({ ...current, original_name: event.target.value }));
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
                                        setForm((current) => ({ ...current, alt: event.target.value }));
                                        setSaveMessage(null);
                                    }}
                                    invalid={Boolean(fieldErrors.alt)}
                                />
                                {fieldErrors.alt?.[0] ? <ErrorMessage>{fieldErrors.alt[0]}</ErrorMessage> : null}
                            </Field>
                            <Field>
                                <Label>Caption</Label>
                                <Textarea
                                    name="caption"
                                    rows={3}
                                    value={form.caption}
                                    onChange={(event) => {
                                        setForm((current) => ({ ...current, caption: event.target.value }));
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
        </div>
    );
}
