// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import {
    formFromCreateResponse,
    isPublished,
    postToFormState,
    publishFormState,
    saveStatusLabel,
    serializeFormState,
    slugify,
    taxonomyFromName,
    toStorePayload,
    unpublishFormState,
} from '@/lib/posts/form';
import type { Post } from '@/types/api';

const samplePost: Post = {
    id: 'post-1',
    title: 'Hello World',
    slug: 'hello-world',
    summary: 'A short summary',
    body: '<p>Existing body</p>',
    featured_image: null,
    featured_image_caption: null,
    published_at: '2026-06-01',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-02T00:00:00Z',
    views_count: 3,
    user_id: 1,
    topic_id: 'topic-1',
    meta: { title: 'SEO title' },
    tags: [{ name: 'News', slug: 'news' }],
    topic: { id: 'topic-1', name: 'Updates', slug: 'updates' },
};

describe('slugify', () => {
    it('converts text to alpha-dash slugs', () => {
        expect(slugify('Hello, Canvas!')).toBe('hello-canvas');
        expect(slugify('   ')).toBe('post');
    });
});

describe('postToFormState', () => {
    it('maps API post fields into editor state', () => {
        expect(postToFormState(samplePost)).toEqual({
            title: 'Hello World',
            slug: 'hello-world',
            summary: 'A short summary',
            body: '<p>Existing body</p>',
            publishedAt: '2026-06-01',
            featuredImage: null,
            featuredImageCaption: null,
            meta: { title: 'SEO title' },
            tags: [{ name: 'News', slug: 'news' }],
            topic: { name: 'Updates', slug: 'updates' },
        });
    });
});

describe('formFromCreateResponse', () => {
    it('builds an empty draft form from create() UUID payload without requiring show()', () => {
        expect(formFromCreateResponse({ id: 'new-1', slug: 'post-new-1' })).toEqual({
            title: '',
            slug: 'post-new-1',
            summary: '',
            body: null,
            publishedAt: null,
            featuredImage: null,
            featuredImageCaption: null,
            meta: null,
            tags: [],
            topic: null,
        });
    });
});

describe('toStorePayload', () => {
    it('serializes form state for the posts store endpoint', () => {
        const form = postToFormState(samplePost);

        expect(toStorePayload(form)).toEqual({
            title: 'Hello World',
            slug: 'hello-world',
            summary: 'A short summary',
            body: '<p>Existing body</p>',
            published_at: '2026-06-01',
            featured_image: null,
            featured_image_caption: null,
            meta: { title: 'SEO title' },
            tags: [{ name: 'News', slug: 'news' }],
            topic: [{ name: 'Updates', slug: 'updates' }],
        });
    });

    it('passes body through unchanged', () => {
        const form = postToFormState({ ...samplePost, body: '<p>Keep me</p>' });

        expect(toStorePayload(form).body).toBe('<p>Keep me</p>');
    });
});

describe('publish helpers', () => {
    it('detects published posts from publishedAt', () => {
        const draft = postToFormState({ ...samplePost, published_at: null });
        const published = postToFormState(samplePost);

        expect(isPublished(draft)).toBe(false);
        expect(isPublished(published)).toBe(true);
    });

    it('sets and clears publishedAt', () => {
        const draft = postToFormState({ ...samplePost, published_at: null });
        const published = publishFormState(draft);

        expect(published.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(unpublishFormState(published).publishedAt).toBeNull();
    });
});

describe('taxonomyFromName', () => {
    it('builds taxonomy options from free text', () => {
        expect(taxonomyFromName('  Product Updates ')).toEqual({
            name: 'Product Updates',
            slug: 'product-updates',
        });
    });
});

describe('serializeFormState', () => {
    it('produces a stable snapshot for dirty checking', () => {
        const form = postToFormState(samplePost);

        expect(serializeFormState(form)).toBe(serializeFormState(postToFormState(samplePost)));
    });
});

describe('saveStatusLabel', () => {
    it('maps autosave statuses to editor chrome copy', () => {
        expect(saveStatusLabel('idle')).toBeNull();
        expect(saveStatusLabel('pending')).toBe('Unsaved changes');
        expect(saveStatusLabel('saving')).toBe('Saving…');
        expect(saveStatusLabel('saved')).toBe('Saved');
        expect(saveStatusLabel('error')).toBe('Save failed');
    });
});
