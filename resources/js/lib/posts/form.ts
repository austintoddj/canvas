import type { Post, PostMeta, PostStorePayload, TaxonomyOption } from '@/types/api';

import { normalizeBodyHtml } from '@/lib/posts/body';

export type PostFormState = {
    title: string;
    slug: string;
    summary: string;
    body: string | null;
    publishedAt: string | null;
    featuredImage: string | null;
    featuredImageCaption: string | null;
    meta: PostMeta | null;
    tags: TaxonomyOption[];
    topic: TaxonomyOption | null;
};

export type PostSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export function saveStatusLabel(status: PostSaveStatus): string | null {
    switch (status) {
        case 'pending':
            return 'Unsaved changes';
        case 'saving':
            return 'Saving…';
        case 'saved':
            return 'Saved';
        case 'error':
            return 'Save failed';
        default:
            return null;
    }
}

export { bodyFromEditorHtml, bodyHtmlForEditor, normalizeBodyHtml } from '@/lib/posts/body';

export function slugify(value: string): string {
    const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return slug === '' ? 'post' : slug;
}

export function toPublishDateString(date: Date = new Date()): string {
    return date.toISOString().slice(0, 10);
}

export function isPublished(form: PostFormState): boolean {
    if (form.publishedAt === null || form.publishedAt === '') {
        return false;
    }

    const published = new Date(form.publishedAt);

    if (Number.isNaN(published.getTime())) {
        return false;
    }

    return published <= new Date();
}

export function postToFormState(post: Post): PostFormState {
    return {
        title: post.title ?? '',
        slug: post.slug ?? '',
        summary: post.summary ?? '',
        body: normalizeBodyHtml(post.body),
        publishedAt: post.published_at,
        featuredImage: post.featured_image,
        featuredImageCaption: post.featured_image_caption,
        meta: post.meta,
        tags: post.tags ?? [],
        topic: post.topic ? { name: post.topic.name, slug: post.topic.slug } : null,
    };
}

/** Draft shell from GET /posts/create (UUID only — row is not persisted yet). */
export function formFromCreateResponse(post: Pick<Post, 'id' | 'slug'>): PostFormState {
    return {
        title: '',
        slug: post.slug ?? '',
        summary: '',
        body: null,
        publishedAt: null,
        featuredImage: null,
        featuredImageCaption: null,
        meta: null,
        tags: [],
        topic: null,
    };
}

export function toStorePayload(form: PostFormState): PostStorePayload {
    return {
        title: form.title,
        slug: form.slug,
        summary: form.summary === '' ? null : form.summary,
        body: normalizeBodyHtml(form.body),
        published_at: form.publishedAt,
        featured_image: form.featuredImage,
        featured_image_caption: form.featuredImageCaption,
        meta: form.meta,
        tags: form.tags,
        topic: form.topic ? [form.topic] : [],
    };
}

export function serializeFormState(form: PostFormState): string {
    return JSON.stringify(toStorePayload(form));
}

export function publishFormState(form: PostFormState): PostFormState {
    return {
        ...form,
        publishedAt: toPublishDateString(),
    };
}

export function unpublishFormState(form: PostFormState): PostFormState {
    return {
        ...form,
        publishedAt: null,
    };
}

export function taxonomyFromName(name: string): TaxonomyOption {
    const trimmed = name.trim();

    return {
        name: trimmed,
        slug: slugify(trimmed),
    };
}
