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

export type PostPublishStatus = 'draft' | 'scheduled' | 'published';

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
 * Local calendar datetime with second fidelity for API payloads.
 * Avoids UTC day-shift when evening local times serialize through ISO-Z alone.
 */
export function toPublishDateTimeString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/** @deprecated Prefer toPublishDateTimeString — kept for callers that only need the day. */
export function toPublishDateString(date: Date = new Date()): string {
    return toPublishDateTimeString(date).slice(0, 10);
}

/** Value for `<input type="datetime-local">` (YYYY-MM-DDTHH:mm). */
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
 * Convert a datetime-local control value into an API-ready local datetime string.
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

    return toPublishDateTimeString(local);
}

export function parsePublishedAt(value: string | null | undefined): Date | null {
    if (value === null || value === undefined) {
        return null;
    }

    const trimmed = value.trim();

    if (trimmed === '') {
        return null;
    }

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

    if (dateOnly !== null) {
        const year = Number(dateOnly[1]);
        const month = Number(dateOnly[2]);
        const day = Number(dateOnly[3]);
        const local = new Date(year, month - 1, day);

        if (local.getFullYear() === year && local.getMonth() === month - 1 && local.getDate() === day) {
            return local;
        }

        return null;
    }

    const localDateTime = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);

    if (localDateTime !== null && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
        const year = Number(localDateTime[1]);
        const month = Number(localDateTime[2]);
        const day = Number(localDateTime[3]);
        const hours = Number(localDateTime[4]);
        const minutes = Number(localDateTime[5]);
        const seconds = localDateTime[6] !== undefined ? Number(localDateTime[6]) : 0;
        const local = new Date(year, month - 1, day, hours, minutes, seconds);

        if (
            local.getFullYear() === year &&
            local.getMonth() === month - 1 &&
            local.getDate() === day &&
            local.getHours() === hours &&
            local.getMinutes() === minutes
        ) {
            return local;
        }

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

export function postToFormState(post: Post): PostFormState {
    return {
        title: post.title ?? '',
        slug: post.slug ?? '',
        summary: post.summary ?? '',
        body: normalizeBodyHtml(post.body),
        publishedAt: post.published_at ?? null,
        featuredImage: post.featured_image ?? null,
        featuredImageCaption: post.featured_image_caption ?? null,
        meta: post.meta ?? null,
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

export function publishFormState(form: PostFormState, at: Date = new Date()): PostFormState {
    return {
        ...form,
        publishedAt: toPublishDateTimeString(at),
    };
}

export function scheduleFormState(form: PostFormState, at: Date | string): PostFormState {
    let publishedAt: string | null;

    if (typeof at === 'string') {
        publishedAt = fromDatetimeLocalValue(at);

        if (publishedAt === null) {
            const parsed = parsePublishedAt(at);
            publishedAt = parsed !== null ? toPublishDateTimeString(parsed) : null;
        }
    } else {
        publishedAt = toPublishDateTimeString(at);
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
