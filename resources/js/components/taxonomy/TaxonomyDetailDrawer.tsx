import { useEffect, useRef, useState } from 'react';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { SideDrawer } from '@/components/SideDrawer';
import { ErrorText } from '@/components/text';
import { ValidationError, type LaravelValidationErrors } from '@/lib/api';
import { tagsApi } from '@/lib/api/tags';
import { topicsApi } from '@/lib/api/topics';
import {
    emptyTaxonomyForm,
    isSlugManuallyEdited,
    isTaxonomyFormValid,
    nextSlugFromName,
    serializeTaxonomyForm,
    taxonomyToFormState,
    toTaxonomyStorePayload,
    type TaxonomyFormState,
} from '@/lib/taxonomy/form';
import { toast } from '@/lib/toast';
import type { Tag, Topic } from '@/types/api';

export type TaxonomyKind = 'tag' | 'topic';

type TaxonomyDetailDrawerProps = {
    kind: TaxonomyKind;
    open: boolean;
    itemId: string | null;
    /** Unsaved create() UUID — skip show() (row does not exist yet). */
    isNew?: boolean;
    onClose: () => void;
    onSaved?: (item: Tag | Topic) => void;
    onDeleted?: (itemId: string) => void;
};

const copy = {
    tag: {
        singular: 'tag',
        titleNew: 'New tag',
        titleEdit: 'Edit tag',
        subtitle: 'Labels for grouping related posts',
        nameDescription: 'What authors see when tagging a post.',
        loadError: 'Unable to load this tag.',
        saveError: 'Unable to save this tag.',
        deleteError: 'Unable to delete this tag.',
        created: 'Tag created.',
        saved: 'Tag saved.',
        deleted: 'Tag deleted.',
        deleteTitle: 'Delete tag?',
        createLabel: 'Create tag',
        saveLabel: 'Save',
    },
    topic: {
        singular: 'topic',
        titleNew: 'New topic',
        titleEdit: 'Edit topic',
        subtitle: 'Main categories for your posts',
        nameDescription: 'What authors see when choosing a topic.',
        loadError: 'Unable to load this topic.',
        saveError: 'Unable to save this topic.',
        deleteError: 'Unable to delete this topic.',
        created: 'Topic created.',
        saved: 'Topic saved.',
        deleted: 'Topic deleted.',
        deleteTitle: 'Delete topic?',
        createLabel: 'Create topic',
        saveLabel: 'Save',
    },
} as const;

function apiFor(kind: TaxonomyKind) {
    return kind === 'tag' ? tagsApi : topicsApi;
}

export function TaxonomyDetailDrawer({
    kind,
    open,
    itemId,
    isNew: isNewProp = false,
    onClose,
    onSaved,
    onDeleted,
}: TaxonomyDetailDrawerProps) {
    const labels = copy[kind];
    const [form, setForm] = useState<TaxonomyFormState>(emptyTaxonomyForm);
    const [baseline, setBaseline] = useState(() => serializeTaxonomyForm(emptyTaxonomyForm()));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<LaravelValidationErrors>({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [isNew, setIsNew] = useState(isNewProp);
    const [ready, setReady] = useState(false);
    const slugManuallyEditedRef = useRef(slugManuallyEdited);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        slugManuallyEditedRef.current = slugManuallyEdited;
    }, [slugManuallyEdited]);

    useEffect(() => {
        if (!open || itemId === null) {
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        queueMicrotask(() => {
            if (cancelled) {
                return;
            }

            setError(null);
            setFieldErrors({});
            setConfirmDeleteOpen(false);
            setDeleting(false);
            setSlugManuallyEdited(false);

            if (isNewProp) {
                const blank = emptyTaxonomyForm();
                setForm(blank);
                setBaseline(serializeTaxonomyForm(blank));
                setIsNew(true);
                setLoading(false);
                setReady(true);
                return;
            }

            setLoading(true);
            setReady(false);
            setForm(emptyTaxonomyForm());
            setBaseline(serializeTaxonomyForm(emptyTaxonomyForm()));
            setIsNew(false);
        });

        if (isNewProp) {
            return () => {
                cancelled = true;
                controller.abort();
            };
        }

        apiFor(kind)
            .show(itemId, controller.signal)
            .then((item) => {
                if (cancelled) {
                    return;
                }

                const nextForm = taxonomyToFormState(item);
                setForm(nextForm);
                setBaseline(serializeTaxonomyForm(nextForm));
                setSlugManuallyEdited(isSlugManuallyEdited(nextForm.name, nextForm.slug));
                setIsNew(false);
                setReady(true);
            })
            .catch(() => {
                if (!cancelled) {
                    setError(labels.loadError);
                    setReady(false);
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
    }, [open, itemId, isNewProp, kind, labels.loadError]);

    useEffect(() => {
        if (!open || !ready || loading) {
            return;
        }

        const timer = window.setTimeout(() => {
            nameInputRef.current?.focus({ preventScroll: true });
        }, 320);

        return () => window.clearTimeout(timer);
    }, [open, ready, loading, itemId]);

    const isDirty = serializeTaxonomyForm(form) !== baseline;
    const displayName = form.name.trim() === '' ? `this ${labels.singular}` : `“${form.name}”`;
    const title = isNew ? labels.titleNew : form.name.trim() === '' ? labels.titleEdit : form.name;
    const showForm = ready && error === null;
    const showFooter = open && itemId !== null && (showForm || loading);

    function handleNameChange(name: string) {
        setForm((current) => ({
            ...current,
            name,
            slug: nextSlugFromName(name, current.slug, slugManuallyEditedRef.current),
        }));
        setFieldErrors((current) => {
            const next = { ...current };
            delete next.name;
            return next;
        });
    }

    function handleSlugChange(slug: string) {
        setSlugManuallyEdited(true);
        setForm((current) => ({ ...current, slug }));
        setFieldErrors((current) => {
            const next = { ...current };
            delete next.slug;
            return next;
        });
    }

    async function handleSave() {
        if (itemId === null || saving || loading) {
            return;
        }

        if (!isTaxonomyFormValid(form)) {
            setFieldErrors({
                ...(form.name.trim() === '' ? { name: ['The name field is required.'] } : {}),
                ...(form.slug.trim() === '' ? { slug: ['The slug field is required.'] } : {}),
            });
            return;
        }

        setSaving(true);
        setFieldErrors({});
        setError(null);

        try {
            const wasCreate = isNew;
            const saved = await apiFor(kind).store(itemId, toTaxonomyStorePayload(form));
            const nextForm = taxonomyToFormState(saved);
            setForm(nextForm);
            setBaseline(serializeTaxonomyForm(nextForm));
            setSlugManuallyEdited(isSlugManuallyEdited(nextForm.name, nextForm.slug));
            setIsNew(false);
            toast.success(wasCreate ? labels.created : labels.saved);
            onSaved?.(saved);

            if (wasCreate) {
                onClose();
            }
        } catch (saveError) {
            if (saveError instanceof ValidationError) {
                setFieldErrors(saveError.errors);
                toast.error('Please fix the highlighted fields.');
            } else {
                setError(labels.saveError);
                toast.error(labels.saveError);
            }
        } finally {
            setSaving(false);
        }
    }

    function openDeleteConfirm() {
        if (deleting || isNew || loading) {
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
        if (itemId === null || isNew || deleting) {
            return;
        }

        setDeleting(true);
        setError(null);

        try {
            await apiFor(kind).destroy(itemId);
            setConfirmDeleteOpen(false);
            toast.success(labels.deleted);
            onDeleted?.(itemId);
            onClose();
        } catch {
            setDeleting(false);
            setConfirmDeleteOpen(false);
            toast.error(labels.deleteError);
        }
    }

    return (
        <>
            <SideDrawer
                open={open}
                onClose={onClose}
                title={loading ? labels.titleEdit : title}
                description={labels.subtitle}
                titleClassName="truncate"
                footer={
                    showFooter ? (
                        <>
                            {!isNew && !loading ? (
                                <Button
                                    type="button"
                                    outline
                                    color="red"
                                    disabled={deleting || saving || loading}
                                    onClick={openDeleteConfirm}
                                >
                                    Delete
                                </Button>
                            ) : (
                                <span />
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" plain disabled={saving || deleting} onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    color="dark/zinc"
                                    disabled={loading || saving || deleting || (!isDirty && !isNew) || !showForm}
                                    onClick={() => void handleSave()}
                                >
                                    {saving ? 'Saving…' : isNew ? labels.createLabel : labels.saveLabel}
                                </Button>
                            </div>
                        </>
                    ) : undefined
                }
            >
                {loading ? (
                    <div className="space-y-6 px-5 py-5" aria-busy="true">
                        <div className="h-4 w-24 animate-pulse rounded bg-zinc-950/10 dark:bg-white/10" />
                        <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-950/10 dark:bg-white/10" />
                        <div className="h-4 w-20 animate-pulse rounded bg-zinc-950/10 dark:bg-white/10" />
                        <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-950/10 dark:bg-white/10" />
                    </div>
                ) : null}

                {!loading && error !== null && !showForm ? (
                    <div className="px-5 py-8">
                        <ErrorText>{error}</ErrorText>
                    </div>
                ) : null}

                {showForm ? (
                    <form
                        className="flex flex-1 flex-col"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSave();
                        }}
                    >
                        <div className="space-y-6 px-5 py-5">
                            {error ? <ErrorText>{error}</ErrorText> : null}

                            <FieldGroup>
                                <Field>
                                    <Label>Name</Label>
                                    <Description>{labels.nameDescription}</Description>
                                    <Input
                                        ref={nameInputRef}
                                        value={form.name}
                                        onChange={(event) => handleNameChange(event.target.value)}
                                        invalid={Boolean(fieldErrors.name)}
                                        name="name"
                                    />
                                    {fieldErrors.name?.[0] ? <ErrorMessage>{fieldErrors.name[0]}</ErrorMessage> : null}
                                </Field>

                                <Field>
                                    <Label>Slug</Label>
                                    <Description>Used in URLs. Fills in from the name until you edit it.</Description>
                                    <Input
                                        value={form.slug}
                                        onChange={(event) => handleSlugChange(event.target.value)}
                                        invalid={Boolean(fieldErrors.slug)}
                                        name="slug"
                                    />
                                    {fieldErrors.slug?.[0] ? <ErrorMessage>{fieldErrors.slug[0]}</ErrorMessage> : null}
                                </Field>
                            </FieldGroup>
                        </div>
                    </form>
                ) : null}
            </SideDrawer>

            <Alert open={confirmDeleteOpen} onClose={closeDeleteConfirm} size="sm">
                <AlertTitle>{labels.deleteTitle}</AlertTitle>
                <AlertDescription>Delete {displayName}? This cannot be undone.</AlertDescription>
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
