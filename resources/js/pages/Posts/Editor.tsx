import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import PostBodyEditor from '@/components/posts/PostBodyEditor';
import PostEditorLayout from '@/components/posts/PostEditorLayout';
import PostInspectorDrawer, { type PostInspectorSection } from '@/components/posts/PostInspectorDrawer';
import PostPreviewDialog from '@/components/posts/PostPreviewDialog';
import PostPublishDialog from '@/components/posts/PostPublishDialog';
import { Skeleton } from '@/components/Skeleton';
import { ErrorText } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMarkOnboardingComplete } from '@/hooks/useMarkOnboardingComplete';
import { usePostAutosave } from '@/hooks/usePostAutosave';
import { postsApi } from '@/lib/api/posts';
import {
    canPublishForm,
    formFromCreateResponse,
    mergeTaxonomyOptions,
    postHasPendingChanges,
    postToFormState,
    publishFormState,
    scheduleFormState,
    serializeFormState,
    slugify,
    unpublishFormState,
    type PostFormState,
} from '@/lib/posts/form';
import { toast } from '@/lib/toast';
import type { Post, TaxonomyOption } from '@/types/api';

const emptyForm = (): PostFormState => ({
    title: '',
    slug: '',
    summary: '',
    body: null,
    publishedAt: null,
    featuredImage: null,
    featuredImageCaption: null,
    meta: null,
    tags: [],
    topic: null,
    author: null,
});

export default function PostsEditor() {
    const { t, user } = useCanvas();
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isNewRoute = location.pathname.endsWith('/new');

    const [form, setForm] = useState<PostFormState>(emptyForm);
    const [postId, setPostId] = useState<string | null>(isNewRoute ? null : (id ?? null));
    const [availableTags, setAvailableTags] = useState<TaxonomyOption[]>([]);
    const [availableTopics, setAvailableTopics] = useState<TaxonomyOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [inspectorSection, setInspectorSection] = useState<PostInspectorSection>('post');
    const [deleting, setDeleting] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(false);
    const [hasPendingChanges, setHasPendingChanges] = useState(false);
    /** False for create() shells until the first successful store. */
    const [draftPersisted, setDraftPersisted] = useState(!isNewRoute);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
    const [publishDialogKey, setPublishDialogKey] = useState(0);
    const [updateConfirmOpen, setUpdateConfirmOpen] = useState(false);
    const [publishBusy, setPublishBusy] = useState(false);

    const slugManuallyEditedRef = useRef(slugManuallyEdited);
    /** create() only mints a UUID — skip show() after redirect to /posts/:id. */
    const bootstrappedPostId = useRef<string | null>(null);
    const allowLeaveRef = useRef(false);
    const syncBaselineRef = useRef<(snapshot: string) => void>(() => {});
    const markOnboardingComplete = useMarkOnboardingComplete();

    const documentPage = form.title.trim() === '' ? t('editor.untitled_post') : form.title.trim();
    useDocumentTitle(loading ? t('posts.title') : documentPage);

    useEffect(() => {
        slugManuallyEditedRef.current = slugManuallyEdited;
    }, [slugManuallyEdited]);

    const autosaveEnabled = postId !== null && !loading && loadError === null;

    const handleSaved = useCallback(
        (post: Post) => {
            setDraftPersisted(true);
            setHasPendingChanges(postHasPendingChanges(post));

            setForm((current) => {
                const nextPublishedAt = post.published_at ?? null;

                if (nextPublishedAt !== null) {
                    const nextTags = current.tags;
                    const nextTopic = current.topic;

                    queueMicrotask(() => {
                        setAvailableTags((tags) => mergeTaxonomyOptions(tags, nextTags));
                        if (nextTopic !== null) {
                            setAvailableTopics((topics) => mergeTaxonomyOptions(topics, [nextTopic]));
                        }
                    });
                }

                // Normalize API datetime onto the form so publish/schedule always
                // reflect the stored go-live time (not only when the string differs).
                if (current.publishedAt === nextPublishedAt) {
                    return current;
                }

                const next = {
                    ...current,
                    publishedAt: nextPublishedAt,
                };

                // Rebase before the form effect runs so API datetime echo does not
                // clobber “Saved” with a false dirty/pending state.
                syncBaselineRef.current(serializeFormState(next));

                return next;
            });
            markOnboardingComplete();
        },
        [markOnboardingComplete]
    );

    const { saveStatus, fieldErrors, isDirty, resetBaseline, saveNow, syncBaseline } = usePostAutosave({
        postId,
        form,
        enabled: autosaveEnabled,
        isPersisted: draftPersisted,
        onSaved: handleSaved,
    });

    useEffect(() => {
        syncBaselineRef.current = syncBaseline;
    }, [syncBaseline]);

    async function handlePublish() {
        if (!canPublishForm(form)) {
            toast.error(t('editor.publish_needs_title', 'Add a title before publishing.'));
            return;
        }

        setPublishBusy(true);

        try {
            // Apply publishedAt only after a successful store so failed validation
            // (empty shell, missing title) never leaves the badge stuck mid-state.
            const next = publishFormState(form);
            const ok = await saveNow(next, { promote: true });

            if (ok) {
                setForm((current) => ({
                    ...current,
                    publishedAt: current.publishedAt ?? next.publishedAt,
                }));
                setHasPendingChanges(false);
                setPublishConfirmOpen(false);
                toast.success(t('editor.published'));
            } else {
                toast.error(t('editor.publish_error'));
            }
        } finally {
            setPublishBusy(false);
        }
    }

    async function handleUpdate() {
        setPublishBusy(true);

        try {
            const ok = await saveNow(form, { promote: true });

            if (ok) {
                setHasPendingChanges(false);
                setUpdateConfirmOpen(false);
                toast.success(t('editor.updated', 'Post updated.'));
            } else {
                toast.error(t('editor.update_error', 'Unable to update this post.'));
            }
        } finally {
            setPublishBusy(false);
        }
    }

    async function handleDiscard() {
        if (postId === null) {
            return;
        }

        try {
            const post = await postsApi.discard(postId);
            const next = postToFormState(post);
            setForm(next);
            setHasPendingChanges(false);
            setSlugManuallyEdited(next.slug !== '' && next.slug !== slugify(next.title));
            resetBaseline(serializeFormState(next));
            toast.success(t('editor.discarded', 'Changes discarded.'));
        } catch {
            toast.error(t('editor.discard_error', 'Unable to discard changes.'));
        }
    }

    async function handleSchedule(datetimeLocal: string) {
        if (!canPublishForm(form)) {
            toast.error(t('editor.publish_needs_title', 'Add a title before publishing.'));
            return;
        }

        setPublishBusy(true);

        try {
            const next = scheduleFormState(form, datetimeLocal);

            if (next.publishedAt === null) {
                toast.error(t('editor.schedule_error'));
                return;
            }

            const ok = await saveNow(next, { promote: true });

            if (ok) {
                setForm((current) => ({
                    ...current,
                    publishedAt: current.publishedAt ?? next.publishedAt,
                }));
                setHasPendingChanges(false);
                setPublishConfirmOpen(false);
                toast.success(t('editor.scheduled'));
            } else {
                toast.error(t('editor.schedule_error'));
            }
        } finally {
            setPublishBusy(false);
        }
    }

    async function handleUnpublish() {
        const next = unpublishFormState(form);
        setForm(next);

        const ok = await saveNow(next, { promote: true });

        if (ok) {
            setHasPendingChanges(false);
            toast.success(t('editor.unpublished'));
        } else {
            toast.error(t('editor.unpublish_error'));
        }
    }

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !allowLeaveRef.current &&
            isDirty &&
            saveStatus !== 'saving' &&
            currentLocation.pathname !== nextLocation.pathname
    );

    const leaveConfirmOpen = blocker.state === 'blocked';

    function cancelLeave() {
        if (blocker.state === 'blocked') {
            blocker.reset();
        }
    }

    function confirmLeave() {
        if (blocker.state === 'blocked') {
            blocker.proceed();
        }
    }

    const hydrateEditor = useCallback(
        (
            nextForm: PostFormState,
            tags: TaxonomyOption[],
            topics: TaxonomyOption[],
            nextPostId: string,
            pending = false
        ) => {
            setForm(nextForm);
            setAvailableTags(tags);
            setAvailableTopics(topics);
            setPostId(nextPostId);
            setHasPendingChanges(pending);
            setSlugManuallyEdited(nextForm.slug !== '' && nextForm.slug !== slugify(nextForm.title));
            resetBaseline(serializeFormState(nextForm));
            setLoading(false);
            setLoadError(null);
        },
        [resetBaseline]
    );

    const openPublishDialog = useCallback(() => {
        setPublishDialogKey((key) => key + 1);
        setPublishConfirmOpen(true);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        async function initialize() {
            if (!isNewRoute && id !== undefined && bootstrappedPostId.current === id) {
                bootstrappedPostId.current = null;
                return;
            }

            setLoading(true);
            setLoadError(null);

            try {
                if (isNewRoute) {
                    const response = await postsApi.create(controller.signal);
                    const nextId = response.post.id;
                    bootstrappedPostId.current = nextId;
                    setDraftPersisted(false);
                    hydrateEditor(
                        formFromCreateResponse(response.post, {
                            id: user.id,
                            name: user.name,
                            username: user.canvas?.username ?? null,
                            avatar_url: user.avatar_url ?? user.canvas?.avatar_url ?? null,
                        }),
                        response.tags,
                        response.topics,
                        nextId,
                        false
                    );
                    navigate(`/posts/${nextId}`, { replace: true });
                    return;
                }

                if (!id) {
                    setLoadError(t('stats.post_not_found'));
                    setLoading(false);
                    return;
                }

                const response = await postsApi.show(id, controller.signal);
                setDraftPersisted(true);
                hydrateEditor(
                    postToFormState(response.post),
                    response.tags,
                    response.topics,
                    response.post.id,
                    postHasPendingChanges(response.post)
                );
            } catch {
                if (!controller.signal.aborted) {
                    setLoadError(t('editor.load_error'));
                    setLoading(false);
                }
            }
        }

        void initialize();

        return () => controller.abort();
    }, [hydrateEditor, id, isNewRoute, navigate, t, user]);

    function handleTitleChange(title: string) {
        setForm((current) => ({
            ...current,
            title,
            slug: slugManuallyEditedRef.current ? current.slug : slugify(title),
        }));
    }

    function handleFormChange(nextForm: PostFormState) {
        setForm(nextForm);
    }

    function handleBodyChange(body: string | null) {
        setForm((current) => ({
            ...current,
            body,
        }));
    }

    function closeDeleteConfirm() {
        if (deleting) {
            return;
        }

        setPendingDelete(false);
    }

    async function confirmDelete() {
        if (postId === null || deleting) {
            return;
        }

        setDeleting(true);

        try {
            await postsApi.destroy(postId);
            allowLeaveRef.current = true;
            resetBaseline(serializeFormState(form));
            setPendingDelete(false);
            setInspectorOpen(false);
            toast.success(t('editor.deleted'));
            navigate('/posts', { replace: true });
        } catch {
            toast.error(t('editor.delete_error'));
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-8" aria-busy="true" data-post-editor-skeleton="true">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-950/10 pb-3 sm:gap-4 sm:pb-4 dark:border-white/10">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <Skeleton className="size-9 rounded-lg" />
                        <Skeleton className="hidden h-7 w-48 rounded-lg sm:block" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="flex shrink-0 gap-1 sm:gap-2">
                        <Skeleton className="hidden h-9 w-16 rounded-lg sm:block" />
                        <Skeleton className="h-9 w-16 rounded-lg" />
                        <Skeleton className="size-9 rounded-lg" />
                    </div>
                </div>
                <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
                    <Skeleton className="h-10 w-3/4 max-w-xl rounded-lg sm:h-14" />
                    <Skeleton className="h-64 w-full rounded-lg" />
                </div>
            </div>
        );
    }

    if (loadError !== null) {
        return (
            <div className="space-y-4">
                <ErrorText>{loadError}</ErrorText>
            </div>
        );
    }

    const deleteTitle = form.title.trim() === '' ? t('posts.this_post') : `“${form.title}”`;

    return (
        <>
            <PostEditorLayout
                form={form}
                postId={postId}
                titleError={fieldErrors.title?.[0]}
                saveStatus={saveStatus}
                hasPendingChanges={hasPendingChanges}
                inspectorOpen={inspectorOpen}
                disabled={!autosaveEnabled}
                publishBusy={publishBusy}
                onTitleChange={handleTitleChange}
                onOpenInspector={() => setInspectorOpen(true)}
                onPreview={draftPersisted ? () => setPreviewOpen(true) : undefined}
                onPublishRequest={draftPersisted ? openPublishDialog : undefined}
                onUpdateRequest={() => setUpdateConfirmOpen(true)}
                body={({ focusMode, onToggleFocusMode }) => (
                    <PostBodyEditor
                        body={form.body}
                        title={form.title}
                        disabled={!autosaveEnabled}
                        focusMode={focusMode}
                        onToggleFocusMode={onToggleFocusMode}
                        onChange={handleBodyChange}
                    />
                )}
            />

            <PostInspectorDrawer
                open={inspectorOpen}
                section={inspectorSection}
                onClose={() => setInspectorOpen(false)}
                onSectionChange={setInspectorSection}
                form={form}
                availableTags={availableTags}
                availableTopics={availableTopics}
                fieldErrors={fieldErrors}
                disabled={!autosaveEnabled}
                hasPendingChanges={hasPendingChanges}
                deleting={deleting}
                onChange={handleFormChange}
                onSlugManualEdit={() => setSlugManuallyEdited(true)}
                onDiscard={handleDiscard}
                onUnpublish={handleUnpublish}
                onChangeSchedule={
                    draftPersisted
                        ? () => {
                              setInspectorOpen(false);
                              openPublishDialog();
                          }
                        : undefined
                }
                onDelete={() => setPendingDelete(true)}
            />

            <PostPreviewDialog open={previewOpen} form={form} onClose={() => setPreviewOpen(false)} />

            <PostPublishDialog
                key={publishDialogKey}
                open={publishConfirmOpen}
                form={form}
                busy={publishBusy}
                disabled={!autosaveEnabled}
                onClose={() => setPublishConfirmOpen(false)}
                onPublishNow={handlePublish}
                onSchedule={handleSchedule}
            />

            <Alert
                open={updateConfirmOpen}
                onClose={() => {
                    if (!publishBusy) {
                        setUpdateConfirmOpen(false);
                    }
                }}
                size="sm"
            >
                <AlertTitle>{t('editor.update_confirm_title', 'Update published post?')}</AlertTitle>
                <AlertDescription>
                    {t('editor.update_confirm_body', 'Readers will see your latest edits on the live post.')}
                </AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={publishBusy} onClick={() => setUpdateConfirmOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="button"
                        color="dark/zinc"
                        disabled={publishBusy || !autosaveEnabled}
                        onClick={() => void handleUpdate()}
                    >
                        {publishBusy ? t('editor.updating', 'Updating…') : t('editor.update', 'Update')}
                    </Button>
                </AlertActions>
            </Alert>

            <Alert open={pendingDelete} onClose={closeDeleteConfirm} size="sm">
                <AlertTitle>{t('editor.delete_title')}</AlertTitle>
                <AlertDescription>{t('editor.delete_confirm_body', { title: deleteTitle })}</AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={deleting} onClick={closeDeleteConfirm}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="button" color="red" disabled={deleting} onClick={() => void confirmDelete()}>
                        {deleting ? t('common.deleting') : t('common.delete')}
                    </Button>
                </AlertActions>
            </Alert>

            <Alert open={leaveConfirmOpen} onClose={cancelLeave} size="sm">
                <AlertTitle>{t('common.leave_without_saving')}</AlertTitle>
                <AlertDescription>{t('common.unsaved_changes')}</AlertDescription>
                <AlertActions>
                    <Button type="button" plain onClick={cancelLeave}>
                        {t('editor.stay')}
                    </Button>
                    <Button type="button" color="red" onClick={confirmLeave}>
                        {t('editor.leave')}
                    </Button>
                </AlertActions>
            </Alert>
        </>
    );
}
