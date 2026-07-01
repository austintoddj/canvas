import type { Post, PostMeta, PostStorePayload, TaxonomyOption } from '@/types/api';

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
        body: post.body,
        publishedAt: post.published_at,
        featuredImage: post.featured_image,
        featuredImageCaption: post.featured_image_caption,
        meta: post.meta,
        tags: post.tags ?? [],
        topic: post.topic ? { name: post.topic.name, slug: post.topic.slug } : null,
    };
}

export function toStorePayload(form: PostFormState): PostStorePayload {
    return {
        title: form.title,
        slug: form.slug,
        summary: form.summary === '' ? null : form.summary,
        body: form.body,
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
