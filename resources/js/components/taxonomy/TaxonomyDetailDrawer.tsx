import { useEffect, useRef, useState } from 'react';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { SideDrawer } from '@/components/SideDrawer';
import { ErrorText } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
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

type TaxonomyCopy = {
    titleNew: string;
    titleEdit: string;
    subtitle: string;
    nameDescription: string;
    loadError: string;
    saveError: string;
    deleteError: string;
    created: string;
    saved: string;
    deleted: string;
    deleteTitle: string;
    createLabel: string;
    saveLabel: string;
};

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
    const { t } = useCanvas();
    const labels: TaxonomyCopy =
        kind === 'tag'
            ? {
                  titleNew: t('taxonomy.tag_new'),
                  titleEdit: t('taxonomy.tag_edit'),
                  subtitle: t('taxonomy.tag_subtitle'),
                  nameDescription: t('taxonomy.tag_name_help'),
                  loadError: t('taxonomy.tag_load_error'),
                  saveError: t('taxonomy.tag_save_error'),
                  deleteError: t('taxonomy.tag_delete_error'),
                  created: t('taxonomy.tag_created'),
                  saved: t('taxonomy.tag_saved'),
                  deleted: t('taxonomy.tag_deleted'),
                  deleteTitle: t('taxonomy.tag_delete_title'),
                  createLabel: t('taxonomy.tag_create'),
                  saveLabel: t('common.save'),
              }
            : {
                  titleNew: t('taxonomy.topic_new'),
                  titleEdit: t('taxonomy.topic_edit'),
                  subtitle: t('taxonomy.topic_subtitle'),
                  nameDescription: t('taxonomy.topic_name_help'),
                  loadError: t('taxonomy.topic_load_error'),
                  saveError: t('taxonomy.topic_save_error'),
                  deleteError: t('taxonomy.topic_delete_error'),
                  created: t('taxonomy.topic_created'),
                  saved: t('taxonomy.topic_saved'),
                  deleted: t('taxonomy.topic_deleted'),
                  deleteTitle: t('taxonomy.topic_delete_title'),
                  createLabel: t('taxonomy.topic_create'),
                  saveLabel: t('common.save'),
              };
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
    const displayName =
        form.name.trim() === ''
            ? kind === 'tag'
                ? t('taxonomy.this_tag')
                : t('taxonomy.this_topic')
            : `“${form.name}”`;
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
                ...(form.name.trim() === '' ? { name: [t('taxonomy.name_required')] } : {}),
                ...(form.slug.trim() === '' ? { slug: [t('taxonomy.slug_required')] } : {}),
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
                toast.error(t('common.please_fix_fields'));
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
                                    {t('common.delete')}
                                </Button>
                            ) : (
                                <span />
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" plain disabled={saving || deleting} onClick={onClose}>
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="button"
                                    color="dark/zinc"
                                    disabled={loading || saving || deleting || (!isDirty && !isNew) || !showForm}
                                    onClick={() => void handleSave()}
                                >
                                    {saving ? t('common.saving') : isNew ? labels.createLabel : labels.saveLabel}
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
                                    <Label>{t('taxonomy.name')}</Label>
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
                                    <Label>{t('taxonomy.slug')}</Label>
                                    <Description>{t('taxonomy.slug_help')}</Description>
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
                <AlertDescription>{t('taxonomy.delete_confirm', { name: displayName })}</AlertDescription>
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
