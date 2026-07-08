// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import {
    firstImageSrc,
    getPublicBaseUrl,
    hasMetaOverrides,
    resolvePostSeo,
    stripHtml,
    truncate,
    updatePostMeta,
} from '@/lib/seo';
import type { CanvasBoot } from '@/types/boot';

function bootFixture(website: string | null = null): CanvasBoot {
    return {
        path: '/canvas',
        languageCodes: ['en'],
        maxUpload: 3_145_728,
        roles: { 1: 'Contributor', 2: 'Editor', 3: 'Admin' },
        timezone: 'UTC',
        translations: '{}',
        unsplash: null,
        version: '7.0.0',
        user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: 'https://example.com/avatar.jpg',
            canvas: {
                role: 2,
                username: null,
                summary: null,
                avatar: null,
                avatar_url: 'https://example.com/avatar.jpg',
                website,
                social: {},
                locale: 'en',
                timezone: 'UTC',
                theme: 'system',
                digest: false,
                preferences: { onboarding: { complete: true } },
            },
        },
    };
}

const baseInput = {
    title: 'Hello World',
    slug: 'hello-world',
    summary: 'A short summary',
    body: '<p>Body copy with <strong>formatting</strong>.</p>',
    featuredImage: null,
    featuredImageCaption: null,
    meta: null,
} as const;

describe('stripHtml', () => {
    it('removes tags and collapses whitespace', () => {
        expect(stripHtml('<p>Hello <em>world</em></p>')).toBe('Hello world');
        expect(stripHtml('&amp; &nbsp; text')).toBe('& text');
    });

    it('returns an empty string for nullish values', () => {
        expect(stripHtml(null)).toBe('');
        expect(stripHtml('')).toBe('');
    });
});

describe('truncate', () => {
    it('truncates long strings with an ellipsis', () => {
        const text = 'one two three four five six seven eight nine ten';

        expect(truncate(text, 20)).toBe('one two three four…');
    });

    it('returns short strings unchanged', () => {
        expect(truncate('short', 20)).toBe('short');
    });
});

describe('firstImageSrc', () => {
    it('extracts the first image src from HTML', () => {
        expect(firstImageSrc('<p>Text</p><img src="https://example.com/a.jpg" alt="A" />')).toBe(
            'https://example.com/a.jpg'
        );
    });

    it('returns null when no image is present', () => {
        expect(firstImageSrc('<p>No images here</p>')).toBeNull();
    });
});

describe('getPublicBaseUrl', () => {
    it('prefers the author website origin when configured', () => {
        window.Canvas = bootFixture('https://blog.example.com/about');

        expect(getPublicBaseUrl()).toBe('https://blog.example.com');
    });

    it('falls back to window.location.origin', () => {
        window.Canvas = bootFixture(null);

        expect(getPublicBaseUrl()).toBe(window.location.origin);
    });
});

describe('resolvePostSeo', () => {
    it('uses meta overrides when present', () => {
        const seo = resolvePostSeo(
            {
                ...baseInput,
                meta: {
                    title: 'SEO title',
                    description: 'SEO description',
                    canonical_link: 'https://example.com/custom',
                },
            },
            'https://example.com'
        );

        expect(seo).toEqual({
            title: 'SEO title',
            description: 'SEO description',
            canonicalUrl: 'https://example.com/custom',
            imageUrl: null,
            imageAlt: 'Hello World',
        });
    });

    it('falls back through title, summary, and body', () => {
        expect(resolvePostSeo(baseInput, 'https://example.com')).toEqual({
            title: 'Hello World',
            description: 'A short summary',
            canonicalUrl: 'https://example.com/posts/hello-world',
            imageUrl: null,
            imageAlt: 'Hello World',
        });

        expect(
            resolvePostSeo(
                {
                    ...baseInput,
                    summary: '',
                },
                'https://example.com'
            ).description
        ).toContain('Body copy');
    });

    it('prefers featured image over inline body images', () => {
        const seo = resolvePostSeo(
            {
                ...baseInput,
                featuredImage: 'https://example.com/hero.jpg',
                featuredImageCaption: 'Hero caption',
                body: '<img src="https://example.com/inline.jpg" />',
            },
            'https://example.com'
        );

        expect(seo.imageUrl).toBe('https://example.com/hero.jpg');
        expect(seo.imageAlt).toBe('Hero caption');
    });

    it('uses the first inline image when no featured image is set', () => {
        const seo = resolvePostSeo(
            {
                ...baseInput,
                body: '<img src="https://example.com/inline.jpg" alt="Inline" />',
            },
            'https://example.com'
        );

        expect(seo.imageUrl).toBe('https://example.com/inline.jpg');
    });
});

describe('meta helpers', () => {
    it('detects when meta overrides exist', () => {
        expect(hasMetaOverrides(null)).toBe(false);
        expect(hasMetaOverrides({ title: '  ' })).toBe(false);
        expect(hasMetaOverrides({ description: 'Custom' })).toBe(true);
    });

    it('merges and clears meta fields', () => {
        expect(updatePostMeta(null, { title: 'Custom title' })).toEqual({ title: 'Custom title' });
        expect(updatePostMeta({ title: 'Custom title', description: 'Desc' }, { title: '' })).toEqual({
            description: 'Desc',
        });
        expect(updatePostMeta({ title: 'Custom title' }, { title: '' })).toBeNull();
    });
});
