// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import {
    formFromCreateResponse,
    isExistingTaxonomy,
    isPublished,
    mergeTaxonomyOptions,
    navSaveStatusLabel,
    postToFormState,
    publishFormState,
    saveStatusLabel,
    serializeFormState,
    slugify,
    taxonomyFromName,
    toPublishDateString,
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

describe('post form helpers', () => {
    it('maps API posts into form state and store payloads', () => {
        expect(slugify('Hello, Canvas!')).toBe('hello-canvas');
        expect(slugify('   ')).toBe('post');
        expect(taxonomyFromName('  Product Updates ')).toEqual({
            name: 'Product Updates',
            slug: 'product-updates',
        });

        const form = postToFormState(samplePost);
        expect(form).toEqual({
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
        expect(formFromCreateResponse({ id: 'new-1', slug: 'post-new-1' })).toMatchObject({
            title: '',
            slug: 'post-new-1',
            body: null,
            publishedAt: null,
        });
        expect(serializeFormState(form)).toBe(serializeFormState(postToFormState(samplePost)));
    });

    it('handles publish state and autosave labels', () => {
        const draft = postToFormState({ ...samplePost, published_at: null });
        expect(isPublished(draft)).toBe(false);
        expect(isPublished(postToFormState(samplePost))).toBe(true);

        // Local calendar day (not UTC) so evening publish is not stored as "tomorrow".
        expect(toPublishDateString(new Date(2026, 0, 5, 15, 30, 0))).toBe('2026-01-05');
        expect(toPublishDateString(new Date(2026, 6, 11, 20, 0, 0))).toBe('2026-07-11');

        const published = publishFormState(draft);
        expect(published.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(isPublished(published)).toBe(true);
        expect(unpublishFormState(published).publishedAt).toBeNull();

        expect(saveStatusLabel('idle')).toBeNull();
        expect(saveStatusLabel('pending')).toBe('Unsaved changes');
        expect(saveStatusLabel('saving')).toBe('Saving…');
        expect(saveStatusLabel('saved')).toBe('Saved');
        expect(saveStatusLabel('error')).toBe('Save failed');

        expect(navSaveStatusLabel('idle')).toBeNull();
        expect(navSaveStatusLabel('pending')).toBeNull();
        expect(navSaveStatusLabel('saving')).toBe('Saving…');
        expect(navSaveStatusLabel('saved')).toBe('Saved');
        expect(navSaveStatusLabel('error')).toBe('Save failed');
    });

    it('detects pending taxonomy vs known Organize options', () => {
        const available = [
            { name: 'News', slug: 'news' },
            { name: 'Updates', slug: 'updates' },
        ];

        expect(isExistingTaxonomy({ name: 'News', slug: 'news' }, available)).toBe(true);
        expect(isExistingTaxonomy({ name: 'Launch', slug: 'launch' }, available)).toBe(false);
        expect(
            mergeTaxonomyOptions(available, [
                { name: 'Launch', slug: 'launch' },
                { name: 'News', slug: 'news' },
            ])
        ).toEqual([
            { name: 'News', slug: 'news' },
            { name: 'Updates', slug: 'updates' },
            { name: 'Launch', slug: 'launch' },
        ]);
    });
});
