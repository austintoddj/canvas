import type { Post, PostAuthor, PostMeta, PostStorePayload, TaxonomyOption } from '@/types/api';

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
    /** Display-only; never included in store payloads. */
    author: PostAuthor | null;
};

export type PostSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export type PostPublishStatus = 'draft' | 'scheduled' | 'published';

/** Title is required by the API — empty shells from create() are not publishable yet. */
export function canPublishForm(form: PostFormState): boolean {
    return form.title.trim() !== '';
}

export function saveStatusLabel(
    status: PostSaveStatus,
    labels?: { pending?: string; saving?: string; saved?: string; error?: string }
): string | null {
    switch (status) {
        case 'pending':
            return labels?.pending ?? 'Unsaved changes';
        case 'saving':
            return labels?.saving ?? 'Saving…';
        case 'saved':
            return labels?.saved ?? 'Saved';
        case 'error':
            return labels?.error ?? 'Save failed';
        default:
            return null;
    }
}

/** Navbar-only: show activity, not steady “idle/pending/saved forever” chrome. */
export function navSaveStatusLabel(
    status: PostSaveStatus,
    labels?: { saving?: string; saved?: string; error?: string }
): string | null {
    switch (status) {
        case 'saving':
            return labels?.saving ?? 'Saving…';
        case 'saved':
            return labels?.saved ?? 'Saved';
        case 'error':
            return labels?.error ?? 'Save failed';
        default:
            return null;
    }
}

/**
 * Ephemeral Saving/Saved beside the badge — drafts/scheduled only.
 * Live posts use Published ↔ Pending edits on the badge instead.
 */
export function editorSaveActivityLabel(
    saveStatus: PostSaveStatus,
    publish: PostPublishStatus,
    labels?: { saving?: string; saved?: string; error?: string }
): string | null {
    if (publish === 'published') {
        return null;
    }

    return navSaveStatusLabel(saveStatus, labels);
}

export type EditorStatusBadgeColor = 'amber' | 'green' | 'blue';

export type EditorStatusBadge = {
    color: EditorStatusBadgeColor;
    label: string;
};

/**
 * Publish-status badge only (never morphs into Saving/Saved).
 * Live + pending → amber “Pending edits”; clean live → green Published.
 */
export function editorStatusBadge(
    status: PostPublishStatus,
    hasPendingChanges: boolean,
    labels?: {
        draft?: string;
        scheduled?: string;
        published?: string;
        unpublishedChanges?: string;
    }
): EditorStatusBadge {
    if (status === 'published' && hasPendingChanges) {
        return {
            color: 'amber',
            label: labels?.unpublishedChanges ?? 'Pending edits',
        };
    }

    if (status === 'published') {
        return {
            color: 'green',
            label: labels?.published ?? 'Published',
        };
    }

    if (status === 'scheduled') {
        return {
            color: 'blue',
            label: labels?.scheduled ?? 'Scheduled',
        };
    }

    return {
        color: 'amber',
        label: labels?.draft ?? 'Draft',
    };
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

/**
 * Absolute instant for API `published_at` (ISO-8601 with Z).
 * Picker wall-clock values are never sent on the wire.
 */
export function toPublishedAtPayload(date: Date = new Date()): string {
    return date.toISOString();
}

/** Value for datetime-local-style picker controls (YYYY-MM-DDTHH:mm) in device local time. */
export function toDatetimeLocalValue(value: string | Date | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const date = typeof value === 'string' ? parsePublishedAt(value) : value;

    if (date === null || Number.isNaN(date.getTime())) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert a datetime-local control value into an API ISO instant.
 * Returns null for empty or invalid input.
 */
export function fromDatetimeLocalValue(value: string): string | null {
    const trimmed = value.trim();

    if (trimmed === '') {
        return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);

    if (match === null) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hours = Number(match[4]);
    const minutes = Number(match[5]);
    const seconds = match[6] !== undefined ? Number(match[6]) : 0;
    const local = new Date(year, month - 1, day, hours, minutes, seconds);

    if (
        local.getFullYear() !== year ||
        local.getMonth() !== month - 1 ||
        local.getDate() !== day ||
        local.getHours() !== hours ||
        local.getMinutes() !== minutes ||
        local.getSeconds() !== seconds
    ) {
        return null;
    }

    return toPublishedAtPayload(local);
}

/**
 * Parse an API `published_at` value as a true instant.
 * Requires a timezone designator (Z or numeric offset); naive strings are rejected.
 */
export function parsePublishedAt(value: string | null | undefined): Date | null {
    if (value === null || value === undefined) {
        return null;
    }

    const trimmed = value.trim();

    if (trimmed === '') {
        return null;
    }

    if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
        return null;
    }

    const parsed = new Date(trimmed);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
}

export function publishStatus(form: PostFormState, now: Date = new Date()): PostPublishStatus {
    if (form.publishedAt === null || form.publishedAt === undefined || form.publishedAt === '') {
        return 'draft';
    }

    const published = parsePublishedAt(form.publishedAt);

    if (published === null) {
        return 'draft';
    }

    return published <= now ? 'published' : 'scheduled';
}

export function isPublished(form: PostFormState, now: Date = new Date()): boolean {
    return publishStatus(form, now) === 'published';
}

export function isScheduled(form: PostFormState, now: Date = new Date()): boolean {
    return publishStatus(form, now) === 'scheduled';
}

export function postHasPendingChanges(post: Pick<Post, 'has_pending_changes' | 'pending'>): boolean {
    if (typeof post.has_pending_changes === 'boolean') {
        return post.has_pending_changes;
    }

    if (post.pending === null || post.pending === undefined) {
        return false;
    }

    return Object.keys(post.pending).length > 0;
}

/**
 * Map an API post into editor form state.
 * Live `published_at` always wins; content fields prefer `pending` when present.
 */
export function postToFormState(post: Post): PostFormState {
    const pending = postHasPendingChanges(post) ? (post.pending ?? null) : null;
    const source = pending ?? post;
    const liveTopic = post.topic ? { name: post.topic.name, slug: post.topic.slug } : null;
    const topic =
        pending !== null && pending.topic !== undefined
            ? pending.topic === null
                ? null
                : { name: pending.topic.name, slug: pending.topic.slug }
            : liveTopic;

    return {
        title: source.title ?? post.title ?? '',
        slug: source.slug ?? post.slug ?? '',
        summary: (source.summary ?? post.summary ?? '') as string,
        body: normalizeBodyHtml(source.body ?? post.body),
        publishedAt: post.published_at ?? null,
        featuredImage: source.featured_image !== undefined ? source.featured_image : (post.featured_image ?? null),
        featuredImageCaption:
            source.featured_image_caption !== undefined
                ? source.featured_image_caption
                : (post.featured_image_caption ?? null),
        meta: source.meta !== undefined ? source.meta : (post.meta ?? null),
        tags: pending?.tags ?? post.tags ?? [],
        topic,
        author: post.user ?? null,
    };
}

/** Draft shell from GET /posts/create (UUID only — row is not persisted yet). */
export function formFromCreateResponse(
    post: Pick<Post, 'id' | 'slug'>,
    provisionalAuthor: PostAuthor | null = null
): PostFormState {
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
        author: provisionalAuthor,
    };
}

export type StorePayloadOptions = {
    promote?: boolean;
    schedule?: boolean;
    publish_now?: boolean;
};

export function toStorePayload(form: PostFormState, options?: StorePayloadOptions): PostStorePayload {
    const publishNow = options?.publish_now === true;

    return {
        title: form.title,
        slug: form.slug,
        summary: form.summary === '' ? null : form.summary,
        body: normalizeBodyHtml(form.body),
        published_at: publishNow ? null : form.publishedAt,
        featured_image: form.featuredImage,
        featured_image_caption: form.featuredImageCaption,
        meta: form.meta,
        tags: form.tags,
        topic: form.topic ? [form.topic] : [],
        ...(options?.promote === true ? { promote: true } : {}),
        ...(options?.schedule === true ? { schedule: true } : {}),
        ...(publishNow ? { publish_now: true } : {}),
    };
}

export function serializeFormState(form: PostFormState): string {
    return JSON.stringify(toStorePayload(form));
}

/**
 * Client-side optimistic publish stamp (ISO). Prefer server `publish_now` for the wire
 * so app/browser clock skew cannot schedule by accident; this still helps status before echo.
 */
export function publishFormState(form: PostFormState, at: Date = new Date()): PostFormState {
    return {
        ...form,
        publishedAt: toPublishedAtPayload(at),
    };
}

export function scheduleFormState(form: PostFormState, at: Date | string): PostFormState {
    let publishedAt: string | null;

    if (typeof at === 'string') {
        publishedAt = fromDatetimeLocalValue(at);

        if (publishedAt === null) {
            const parsed = parsePublishedAt(at);
            publishedAt = parsed !== null ? toPublishedAtPayload(parsed) : null;
        }
    } else {
        publishedAt = toPublishedAtPayload(at);
    }

    return {
        ...form,
        publishedAt,
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

/** True when this option already exists in Organize (by slug). */
export function isExistingTaxonomy(option: TaxonomyOption, available: TaxonomyOption[]): boolean {
    return available.some((item) => item.slug === option.slug);
}

export function mergeTaxonomyOptions(available: TaxonomyOption[], extras: TaxonomyOption[]): TaxonomyOption[] {
    const bySlug = new Map(available.map((item) => [item.slug, item]));

    for (const item of extras) {
        if (!bySlug.has(item.slug)) {
            bySlug.set(item.slug, item);
        }
    }

    return Array.from(bySlug.values());
}
