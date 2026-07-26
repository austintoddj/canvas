import type { PostMeta } from '@/types/api';
import { hostOrigin } from '@/lib/urls';

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
        .replace(/<script\b[\s\S]*?<\/script(?:\s[^>]*)?>/gi, '')
        .replace(/<style\b[\s\S]*?<\/style(?:\s[^>]*)?>/gi, '')
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
    return hostOrigin();
}

export type PostSeoFallbacks = {
    untitledPost?: string;
    noDescription?: string;
    featuredImage?: string;
};

export function resolvePostSeo(
    input: PostSeoInput,
    publicBaseUrl: string = getPublicBaseUrl(),
    fallbacks?: PostSeoFallbacks
): ResolvedSeo {
    const baseUrl = publicBaseUrl.replace(/\/$/, '');
    const slugSegment = input.slug === '' ? '…' : input.slug;
    const bodyDescription = truncate(stripHtml(input.body), 160);

    return {
        title: input.meta?.title?.trim() || input.title.trim() || (fallbacks?.untitledPost ?? 'Untitled post'),
        description:
            input.meta?.description?.trim() ||
            input.summary.trim() ||
            bodyDescription ||
            (fallbacks?.noDescription ?? 'No description available.'),
        canonicalUrl: input.meta?.canonical_link?.trim() || `${baseUrl}/posts/${slugSegment}`,
        imageUrl: input.featuredImage || firstImageSrc(input.body),
        imageAlt:
            input.featuredImageCaption?.trim() || input.title.trim() || (fallbacks?.featuredImage ?? 'Featured image'),
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

/** Must stay under AiRewriteRequest SEO text max (3000). */
export const SEO_SOURCE_MAX = 3000;
const SEO_SOURCE_BODY_MAX = 2000;
const SEO_SOURCE_SUMMARY_MAX = 1200;

/**
 * Pack post fields for SEO AI. Prefer title + summary; include a short body lede
 * only when summary is empty. Caps total length so the API never rejects the payload.
 */
export function seoSourceText(input: Pick<PostSeoInput, 'title' | 'summary' | 'body'>): string | null {
    const title = input.title.trim();
    const summary = input.summary.trim();
    const bodyPlain = stripHtml(input.body);
    const parts: string[] = [];

    if (title !== '') {
        parts.push(`Title: ${title}`);
    }

    if (summary !== '') {
        const cappedSummary = truncate(summary, SEO_SOURCE_SUMMARY_MAX);
        parts.push(`Summary: ${cappedSummary}`);
    } else if (bodyPlain !== '') {
        const prefix = parts.join('\n\n');
        const bodyBudget = Math.min(
            SEO_SOURCE_BODY_MAX,
            SEO_SOURCE_MAX - (prefix === '' ? 0 : prefix.length + 2) - 'Body:\n'.length
        );

        if (bodyBudget > 0) {
            const body = truncate(bodyPlain, bodyBudget);

            if (body !== '') {
                parts.push(`Body:\n${body}`);
            }
        }
    }

    if (parts.length === 0) {
        return null;
    }

    const packed = parts.join('\n\n');

    if (packed.length <= SEO_SOURCE_MAX) {
        return packed;
    }

    return packed.slice(0, SEO_SOURCE_MAX).trimEnd();
}
