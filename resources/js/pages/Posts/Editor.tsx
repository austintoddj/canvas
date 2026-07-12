import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import PostBodyEditor from '@/components/posts/PostBodyEditor';
import FeaturedImagePicker from '@/components/posts/FeaturedImagePicker';
import PostEditorLayout from '@/components/posts/PostEditorLayout';
import PostSeoPanel from '@/components/posts/PostSeoPanel';
import PostSidebar from '@/components/posts/PostSidebar';
import PublishPanel from '@/components/posts/PublishPanel';
import { Divider } from '@/components/divider';
import { Heading } from '@/components/heading';
import { SideDrawer } from '@/components/SideDrawer';
import { Skeleton } from '@/components/Skeleton';
import { PageDescription, ErrorText } from '@/components/text';
import { useMarkOnboardingComplete } from '@/hooks/useMarkOnboardingComplete';
import { usePostAutosave } from '@/hooks/usePostAutosave';
import { postsApi } from '@/lib/api/posts';
import {
    formFromCreateResponse,
    mergeTaxonomyOptions,
    postToFormState,
    publishFormState,
    serializeFormState,
    slugify,
    unpublishFormState,
    type PostFormState,
} from '@/lib/posts/form';
import { toast } from '@/lib/toast';
import type { TaxonomyOption } from '@/types/api';

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
});

export default function PostsEditor() {
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
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [seoOpen, setSeoOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(false);

    const slugManuallyEditedRef = useRef(slugManuallyEdited);
    /** create() only mints a UUID — skip show() after redirect to /posts/:id. */
    const bootstrappedPostId = useRef<string | null>(null);
    const allowLeaveRef = useRef(false);
    const markOnboardingComplete = useMarkOnboardingComplete();

    useEffect(() => {
        slugManuallyEditedRef.current = slugManuallyEdited;
    }, [slugManuallyEdited]);

    const autosaveEnabled = postId !== null && !loading && loadError === null;

    const handleSaved = useCallback(
        (post: { published_at: string | null }) => {
            setForm((current) => {
                if (post.published_at !== null) {
                    const nextTags = current.tags;
                    const nextTopic = current.topic;

                    queueMicrotask(() => {
                        setAvailableTags((tags) => mergeTaxonomyOptions(tags, nextTags));
                        if (nextTopic !== null) {
                            setAvailableTopics((topics) => mergeTaxonomyOptions(topics, [nextTopic]));
                        }
                    });
                }

                if (current.publishedAt === post.published_at) {
                    return current;
                }

                return {
                    ...current,
                    publishedAt: post.published_at,
                };
            });
            markOnboardingComplete();
        },
        [markOnboardingComplete]
    );

    const { saveStatus, fieldErrors, isDirty, resetBaseline, saveNow } = usePostAutosave({
        postId,
        form,
        enabled: autosaveEnabled,
        onSaved: handleSaved,
    });

    async function handlePublish() {
        const next = publishFormState(form);
        setForm(next);

        const ok = await saveNow(next);

        if (ok) {
            toast.success('Post published.');
        } else {
            toast.error('Unable to publish this post.');
        }
    }

    async function handleUnpublish() {
        const next = unpublishFormState(form);
        setForm(next);

        const ok = await saveNow(next);

        if (ok) {
            toast.success('Post unpublished.');
        } else {
            toast.error('Unable to unpublish this post.');
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
        (nextForm: PostFormState, tags: TaxonomyOption[], topics: TaxonomyOption[], nextPostId: string) => {
            setForm(nextForm);
            setAvailableTags(tags);
            setAvailableTopics(topics);
            setPostId(nextPostId);
            setSlugManuallyEdited(nextForm.slug !== '' && nextForm.slug !== slugify(nextForm.title));
            resetBaseline(serializeFormState(nextForm));
            setLoading(false);
            setLoadError(null);
        },
        [resetBaseline]
    );

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
                    hydrateEditor(formFromCreateResponse(response.post), response.tags, response.topics, nextId);
                    navigate(`/posts/${nextId}`, { replace: true });
                    return;
                }

                if (!id) {
                    setLoadError('Post not found.');
                    setLoading(false);
                    return;
                }

                const response = await postsApi.show(id, controller.signal);
                hydrateEditor(postToFormState(response.post), response.tags, response.topics, response.post.id);
            } catch {
                if (!controller.signal.aborted) {
                    setLoadError('Unable to load this post.');
                    setLoading(false);
                }
            }
        }

        void initialize();

        return () => controller.abort();
    }, [hydrateEditor, id, isNewRoute, navigate]);

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
            setSettingsOpen(false);
            toast.success('Post deleted.');
            navigate('/posts', { replace: true });
        } catch {
            toast.error('Unable to delete this post.');
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-8" aria-busy="true" data-post-editor-skeleton="true">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-950/10 pb-4 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-lg" />
                        <Skeleton className="h-7 w-48 rounded-lg" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="size-9 rounded-lg" />
                        <Skeleton className="size-9 rounded-lg" />
                    </div>
                </div>
                <div className="mx-auto max-w-3xl space-y-6">
                    <Skeleton className="h-14 w-3/4 max-w-xl rounded-lg" />
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

    const deleteTitle = form.title.trim() === '' ? 'this post' : `“${form.title}”`;

    return (
        <>
            <PostEditorLayout
                form={form}
                postId={postId}
                titleError={fieldErrors.title?.[0]}
                saveStatus={saveStatus}
                disabled={!autosaveEnabled}
                onTitleChange={handleTitleChange}
                onOpenSettings={() => {
                    setSeoOpen(false);
                    setSettingsOpen(true);
                }}
                onOpenSeo={() => {
                    setSettingsOpen(false);
                    setSeoOpen(true);
                }}
                body={({ focusMode, onToggleFocusMode }) => (
                    <PostBodyEditor
                        body={form.body}
                        disabled={!autosaveEnabled}
                        focusMode={focusMode}
                        onToggleFocusMode={onToggleFocusMode}
                        onChange={handleBodyChange}
                    />
                )}
            />

            <SideDrawer
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                title="Post settings"
                description="URL, summary, taxonomy, image, and publish"
            >
                <div className="min-w-0 space-y-6 overflow-x-hidden px-5 py-5">
                    <div className="min-w-0">
                        <Heading level={3} className="text-base/7">
                            Details
                        </Heading>
                        <PageDescription>Slug, excerpt, topic, and tags</PageDescription>
                        <div className="mt-4 min-w-0">
                            <PostSidebar
                                form={form}
                                availableTags={availableTags}
                                availableTopics={availableTopics}
                                fieldErrors={fieldErrors}
                                disabled={!autosaveEnabled}
                                onChange={handleFormChange}
                                onSlugManualEdit={() => setSlugManuallyEdited(true)}
                            />
                        </div>
                    </div>

                    <Divider soft />

                    <div className="min-w-0">
                        <Heading level={3} className="text-base/7">
                            Featured image
                        </Heading>
                        <PageDescription>Shown at the top of the post and in social previews.</PageDescription>
                        <div className="mt-4 min-w-0">
                            <FeaturedImagePicker form={form} disabled={!autosaveEnabled} onChange={handleFormChange} />
                        </div>
                    </div>

                    <Divider soft />

                    <PublishPanel
                        form={form}
                        disabled={!autosaveEnabled}
                        deleting={deleting}
                        onPublish={handlePublish}
                        onUnpublish={handleUnpublish}
                        onDelete={() => setPendingDelete(true)}
                    />
                </div>
            </SideDrawer>

            <SideDrawer
                open={seoOpen}
                onClose={() => setSeoOpen(false)}
                title="SEO"
                description="Title, description, and canonical URL for search"
            >
                <div className="min-w-0 overflow-x-hidden px-5 py-5">
                    <PostSeoPanel
                        form={form}
                        fieldErrors={fieldErrors}
                        disabled={!autosaveEnabled}
                        onChange={handleFormChange}
                    />
                </div>
            </SideDrawer>

            <Alert open={pendingDelete} onClose={closeDeleteConfirm} size="sm">
                <AlertTitle>Delete post?</AlertTitle>
                <AlertDescription>Delete {deleteTitle}? This cannot be undone.</AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={deleting} onClick={closeDeleteConfirm}>
                        Cancel
                    </Button>
                    <Button type="button" color="red" disabled={deleting} onClick={() => void confirmDelete()}>
                        {deleting ? 'Deleting…' : 'Delete'}
                    </Button>
                </AlertActions>
            </Alert>

            <Alert open={leaveConfirmOpen} onClose={cancelLeave} size="sm">
                <AlertTitle>Leave without saving?</AlertTitle>
                <AlertDescription>You have unsaved changes. Leave this post without saving?</AlertDescription>
                <AlertActions>
                    <Button type="button" plain onClick={cancelLeave}>
                        Stay
                    </Button>
                    <Button type="button" color="red" onClick={confirmLeave}>
                        Leave
                    </Button>
                </AlertActions>
            </Alert>
        </>
    );
}
