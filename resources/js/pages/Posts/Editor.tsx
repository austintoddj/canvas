import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';

import BodyEditorPlaceholder from '@/components/posts/BodyEditorPlaceholder';
import FeaturedImagePicker from '@/components/posts/FeaturedImagePicker';
import PostEditorLayout from '@/components/posts/PostEditorLayout';
import PostSeoPanel from '@/components/posts/PostSeoPanel';
import PostSidebar from '@/components/posts/PostSidebar';
import PublishPanel from '@/components/posts/PublishPanel';
import { Divider } from '@/components/divider';
import { Heading } from '@/components/heading';
import { Text } from '@/components/text';
import { usePostAutosave } from '@/hooks/usePostAutosave';
import { postsApi } from '@/lib/api/posts';
import { postToFormState, serializeFormState, slugify, type PostFormState } from '@/lib/posts/form';
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

    useEffect(() => {
        slugManuallyEditedRef.current = slugManuallyEdited;
    }, [slugManuallyEdited]);

    const autosaveEnabled = postId !== null && !loading && loadError === null;

    const { saveStatus, fieldErrors, isDirty, saveNow, resetBaseline } = usePostAutosave({
        postId,
        form,
        enabled: autosaveEnabled,
        onSaved: (post) => {
            setForm((current) => ({
                ...current,
                publishedAt: post.published_at,
            }));
        },
    });

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && saveStatus !== 'saving' && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state !== 'blocked') {
            return;
        }

        const shouldLeave = window.confirm('You have unsaved changes. Leave without saving?');

        if (shouldLeave) {
            blocker.proceed();
        } else {
            blocker.reset();
        }
    }, [blocker]);

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
            setLoading(true);
            setLoadError(null);

            try {
                if (isNewRoute) {
                    const response = await postsApi.create(controller.signal);
                    navigate(`/posts/${response.post.id}`, { replace: true });
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

    if (loading) {
        return (
            <div className="px-8 py-12">
                <Text className="text-zinc-500">Loading post…</Text>
            </div>
        );
    }

    if (loadError !== null) {
        return (
            <div className="px-8 py-12">
                <Text className="text-red-600 dark:text-red-500">{loadError}</Text>
            </div>
        );
    }

    return (
        <PostEditorLayout
            form={form}
            titleError={fieldErrors.title?.[0]}
            saveStatus={saveStatus}
            disabled={!autosaveEnabled}
            onTitleChange={handleTitleChange}
            onSaveNow={() => void saveNow()}
            body={<BodyEditorPlaceholder />}
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
                        <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Hero image for the post and social previews
                        </Text>
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
                        <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Search and social metadata overrides
                        </Text>
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
    );
}
