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
        unsplash: false,
        version: '7.0.0',
        user: {
            id: 1,
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

describe('seo helpers', () => {
    it('strips HTML, truncates text, and finds the first image', () => {
        expect(stripHtml('<p>Hello <em>world</em></p>')).toBe('Hello world');
        expect(stripHtml(null)).toBe('');
        expect(truncate('one two three four five six seven eight nine ten', 20)).toBe('one two three four…');
        expect(truncate('short', 20)).toBe('short');
        expect(firstImageSrc('<p>Text</p><img src="https://example.com/a.jpg" alt="A" />')).toBe(
            'https://example.com/a.jpg'
        );
        expect(firstImageSrc('<p>No images</p>')).toBeNull();
    });

    it('resolves public base URL and post SEO with overrides and fallbacks', () => {
        window.Canvas = bootFixture('https://blog.example.com/about');
        expect(getPublicBaseUrl()).toBe('https://blog.example.com');
        window.Canvas = bootFixture(null);
        expect(getPublicBaseUrl()).toBe(window.location.origin);

        expect(
            resolvePostSeo(
                {
                    ...baseInput,
                    meta: {
                        title: 'SEO title',
                        description: 'SEO description',
                        canonical_link: 'https://example.com/custom',
                    },
                },
                'https://example.com'
            )
        ).toEqual({
            title: 'SEO title',
            description: 'SEO description',
            canonicalUrl: 'https://example.com/custom',
            imageUrl: null,
            imageAlt: 'Hello World',
        });

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
                    featuredImage: 'https://example.com/hero.jpg',
                    featuredImageCaption: 'Hero caption',
                    body: '<img src="https://example.com/inline.jpg" />',
                },
                'https://example.com'
            )
        ).toMatchObject({ imageUrl: 'https://example.com/hero.jpg', imageAlt: 'Hero caption' });
    });

    it('detects and merges meta overrides', () => {
        expect(hasMetaOverrides(null)).toBe(false);
        expect(hasMetaOverrides({ title: '  ' })).toBe(false);
        expect(hasMetaOverrides({ description: 'Custom' })).toBe(true);
        expect(updatePostMeta(null, { title: 'Custom title' })).toEqual({ title: 'Custom title' });
        expect(updatePostMeta({ title: 'Custom title', description: 'Desc' }, { title: '' })).toEqual({
            description: 'Desc',
        });
        expect(updatePostMeta({ title: 'Custom title' }, { title: '' })).toBeNull();
    });
});
