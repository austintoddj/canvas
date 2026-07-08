import type { PostMeta } from '@/types/api';

export type ResolvedSeo = {
    title: string;
    description: string;
    canonicalUrl: string;
    imageUrl: string | null;
    imageAlt: string;
};

export type PostSeoInput = {
    title: string;
    slug: string;
    summary: string;
    body: string | null;
    featuredImage: string | null;
    featuredImageCaption: string | null;
    meta: PostMeta | null;
};

const IMG_SRC_PATTERN = /<img[^>]+src=["']([^"']+)["']/i;

export function stripHtml(html: string | null | undefined): string {
    if (html == null || html === '') {
        return '';
    }

    return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }

    const trimmed = text.slice(0, maxLength).trimEnd();

    return `${trimmed.replace(/\s+\S*$/, '')}…`;
}

export function firstImageSrc(html: string | null | undefined): string | null {
    if (html == null || html === '') {
        return null;
    }

    const match = html.match(IMG_SRC_PATTERN);

    return match?.[1] ?? null;
}

export function isValidUrl(value: string): boolean {
    if (value.trim() === '') {
        return true;
    }

    try {
        const url = new URL(value);

        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

export function getPublicBaseUrl(): string {
    const website = window.Canvas?.user?.canvas?.website?.trim();

    if (website) {
        try {
            const url = new URL(website);

            return url.origin;
        } catch {
            // Fall through to origin when website is not a valid absolute URL.
        }
    }

    return window.location.origin;
}

export function resolvePostSeo(input: PostSeoInput, publicBaseUrl: string = getPublicBaseUrl()): ResolvedSeo {
    const baseUrl = publicBaseUrl.replace(/\/$/, '');
    const slugSegment = input.slug === '' ? '…' : input.slug;
    const bodyDescription = truncate(stripHtml(input.body), 160);

    return {
        title: input.meta?.title?.trim() || input.title.trim() || 'Untitled post',
        description:
            input.meta?.description?.trim() || input.summary.trim() || bodyDescription || 'No description available.',
        canonicalUrl: input.meta?.canonical_link?.trim() || `${baseUrl}/posts/${slugSegment}`,
        imageUrl: input.featuredImage || firstImageSrc(input.body),
        imageAlt: input.featuredImageCaption?.trim() || input.title.trim() || 'Featured image',
    };
}

export function hasMetaOverrides(meta: PostMeta | null | undefined): boolean {
    if (meta == null) {
        return false;
    }

    return (
        (meta.title?.trim() ?? '') !== '' ||
        (meta.description?.trim() ?? '') !== '' ||
        (meta.canonical_link?.trim() ?? '') !== ''
    );
}

export function updatePostMeta(meta: PostMeta | null, patch: Partial<PostMeta>): PostMeta | null {
    const next: PostMeta = { ...(meta ?? {}) };

    for (const [key, value] of Object.entries(patch) as [keyof PostMeta, string | undefined][]) {
        const trimmed = value?.trim() ?? '';

        if (trimmed === '') {
            delete next[key];
        } else {
            next[key] = trimmed;
        }
    }

    return hasMetaOverrides(next) ? next : null;
}
