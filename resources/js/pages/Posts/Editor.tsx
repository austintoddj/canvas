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
import { Skeleton } from '@/components/Skeleton';
import { PageDescription, ErrorText } from '@/components/text';
import { useMarkOnboardingComplete } from '@/hooks/useMarkOnboardingComplete';
import { usePostAutosave } from '@/hooks/usePostAutosave';
import { postsApi } from '@/lib/api/posts';
import {
    formFromCreateResponse,
    postToFormState,
    serializeFormState,
    slugify,
    type PostFormState,
} from '@/lib/posts/form';
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

    const slugManuallyEditedRef = useRef(slugManuallyEdited);
    /** create() only mints a UUID — skip show() after redirect to /posts/:id. */
    const bootstrappedPostId = useRef<string | null>(null);

    useEffect(() => {
        slugManuallyEditedRef.current = slugManuallyEdited;
    }, [slugManuallyEdited]);

    const autosaveEnabled = postId !== null && !loading && loadError === null;
    const markOnboardingComplete = useMarkOnboardingComplete();

    const { saveStatus, fieldErrors, isDirty, saveNow, resetBaseline } = usePostAutosave({
        postId,
        form,
        enabled: autosaveEnabled,
        onSaved: (post) => {
            setForm((current) => ({
                ...current,
                publishedAt: post.published_at,
            }));
            markOnboardingComplete();
        },
    });

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && saveStatus !== 'saving' && currentLocation.pathname !== nextLocation.pathname
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

    if (loading) {
        return (
            <div className="space-y-8" aria-busy="true" data-post-editor-skeleton="true">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-950/10 pb-4 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-lg" />
                        <Skeleton className="h-7 w-48 rounded-lg" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-9 w-20 rounded-lg" />
                </div>
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
                    <div className="min-w-0 space-y-6">
                        <Skeleton className="h-12 w-3/4 max-w-xl rounded-lg" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-40 w-full rounded-lg" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <Skeleton className="h-28 w-full rounded-lg" />
                    </div>
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

    return (
        <>
            <PostEditorLayout
                form={form}
                titleError={fieldErrors.title?.[0]}
                saveStatus={saveStatus}
                disabled={!autosaveEnabled}
                onTitleChange={handleTitleChange}
                onSaveNow={() => void saveNow()}
                body={<PostBodyEditor body={form.body} disabled={!autosaveEnabled} onChange={handleBodyChange} />}
                sidebar={
                    <>
                        <PostSidebar
                            form={form}
                            availableTags={availableTags}
                            availableTopics={availableTopics}
                            fieldErrors={fieldErrors}
                            disabled={!autosaveEnabled}
                            onChange={handleFormChange}
                            onSlugManualEdit={() => setSlugManuallyEdited(true)}
                        />

                        <Divider soft />

                        <div>
                            <Heading level={3} className="text-base/7">
                                Featured image
                            </Heading>
                            <PageDescription>Hero image for the post and social previews</PageDescription>
                            <div className="mt-4">
                                <FeaturedImagePicker
                                    form={form}
                                    disabled={!autosaveEnabled}
                                    onChange={handleFormChange}
                                />
                            </div>
                        </div>

                        <Divider soft />

                        <div>
                            <Heading level={3} className="text-base/7">
                                SEO
                            </Heading>
                            <PageDescription>Search and social metadata overrides</PageDescription>
                            <div className="mt-4">
                                <PostSeoPanel
                                    form={form}
                                    fieldErrors={fieldErrors}
                                    disabled={!autosaveEnabled}
                                    onChange={handleFormChange}
                                />
                            </div>
                        </div>

                        <Divider soft />

                        <PublishPanel
                            form={form}
                            saveStatus={saveStatus}
                            disabled={!autosaveEnabled}
                            onChange={handleFormChange}
                            onSaveNow={() => void saveNow()}
                        />
                    </>
                }
            />

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
