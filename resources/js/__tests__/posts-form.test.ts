// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import {
    canPublishForm,
    formFromCreateResponse,
    fromDatetimeLocalValue,
    isExistingTaxonomy,
    isPublished,
    isScheduled,
    mergeTaxonomyOptions,
    editorSaveActivityLabel,
    editorStatusBadge,
    navSaveStatusLabel,
    parsePublishedAt,
    postHasPendingChanges,
    postToFormState,
    publishFormState,
    publishStatus,
    saveStatusLabel,
    scheduleFormState,
    serializeFormState,
    slugify,
    taxonomyFromName,
    toDatetimeLocalValue,
    toPublishDateString,
    toPublishDateTimeString,
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
    published_at: '2026-06-01 09:30:00',
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
            publishedAt: '2026-06-01 09:30:00',
            featuredImage: null,
            featuredImageCaption: null,
            meta: { title: 'SEO title' },
            tags: [{ name: 'News', slug: 'news' }],
            topic: { name: 'Updates', slug: 'updates' },
            author: null,
        });
        expect(toStorePayload(form)).toEqual({
            title: 'Hello World',
            slug: 'hello-world',
            summary: 'A short summary',
            body: '<p>Existing body</p>',
            published_at: '2026-06-01 09:30:00',
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
            author: null,
        });
        expect(
            formFromCreateResponse(
                { id: 'new-1', slug: 'post-new-1' },
                { id: 9, name: 'Ada', username: 'ada', avatar_url: null }
            ).author
        ).toEqual({ id: 9, name: 'Ada', username: 'ada', avatar_url: null });
        expect(serializeFormState(form)).toBe(serializeFormState(postToFormState(samplePost)));
        expect(serializeFormState(form)).not.toContain('author');
        expect(toStorePayload(form, { promote: true }).promote).toBe(true);
        expect(serializeFormState(form)).not.toContain('promote');
    });

    it('maps API author for display only', () => {
        const form = postToFormState({
            ...samplePost,
            user: {
                id: 4,
                name: 'Grace Hopper',
                username: 'grace',
                avatar_url: 'https://cdn.example/grace.jpg',
            },
        });

        expect(form.author).toEqual({
            id: 4,
            name: 'Grace Hopper',
            username: 'grace',
            avatar_url: 'https://cdn.example/grace.jpg',
        });
        expect(toStorePayload(form)).not.toHaveProperty('user');
        expect(toStorePayload(form)).not.toHaveProperty('author');
    });

    it('prefers pending content when hydrating a published post', () => {
        const withPending: Post = {
            ...samplePost,
            has_pending_changes: true,
            pending: {
                title: 'Pending title',
                slug: 'pending-slug',
                summary: 'Pending summary',
                body: '<p>Pending body</p>',
                tags: [{ name: 'Draft Tag', slug: 'draft-tag' }],
                topic: { name: 'Draft Topic', slug: 'draft-topic' },
            },
        };

        expect(postHasPendingChanges(withPending)).toBe(true);
        expect(postToFormState(withPending)).toMatchObject({
            title: 'Pending title',
            slug: 'pending-slug',
            summary: 'Pending summary',
            body: '<p>Pending body</p>',
            publishedAt: samplePost.published_at,
            tags: [{ name: 'Draft Tag', slug: 'draft-tag' }],
            topic: { name: 'Draft Topic', slug: 'draft-topic' },
        });

        expect(
            postHasPendingChanges({
                ...samplePost,
                has_pending_changes: false,
                pending: null,
            })
        ).toBe(false);

        // Trust the API flag when present — do not re-derive from a stale pending blob.
        expect(
            postHasPendingChanges({
                ...samplePost,
                has_pending_changes: false,
                pending: { title: 'stale' },
            })
        ).toBe(false);
    });

    it('handles publish, schedule, and draft state with time fidelity', () => {
        const draft = postToFormState({ ...samplePost, published_at: null });
        expect(isPublished(draft)).toBe(false);
        expect(isScheduled(draft)).toBe(false);
        expect(publishStatus(draft)).toBe('draft');
        expect(isPublished(postToFormState(samplePost))).toBe(true);

        // Create-shaped payloads omit published_at; never throw when status is read during render.
        const createShaped = postToFormState({
            id: 'new-2',
            slug: 'post-new-2',
        } as Post);
        expect(createShaped.publishedAt).toBeNull();
        expect(publishStatus(createShaped)).toBe('draft');
        expect(publishStatus({ ...draft, publishedAt: undefined as unknown as string | null })).toBe('draft');
        expect(parsePublishedAt(undefined)).toBeNull();
        expect(parsePublishedAt(null)).toBeNull();

        expect(toPublishDateTimeString(new Date(2026, 0, 5, 15, 30, 0))).toBe('2026-01-05 15:30:00');
        expect(toPublishDateTimeString(new Date(2026, 6, 11, 20, 0, 45))).toBe('2026-07-11 20:00:45');
        expect(toPublishDateString(new Date(2026, 0, 5, 15, 30, 0))).toBe('2026-01-05');

        const published = publishFormState(draft, new Date(2026, 2, 10, 8, 15, 30));
        expect(published.publishedAt).toBe('2026-03-10 08:15:30');
        expect(isPublished(published, new Date(2026, 2, 10, 8, 15, 30))).toBe(true);
        expect(unpublishFormState(published).publishedAt).toBeNull();

        const scheduled = scheduleFormState(draft, '2099-06-15T14:45');
        expect(scheduled.publishedAt).toBe('2099-06-15 14:45:00');
        expect(publishStatus(scheduled, new Date(2026, 0, 1))).toBe('scheduled');
        expect(isScheduled(scheduled, new Date(2026, 0, 1))).toBe(true);
        expect(isPublished(scheduled, new Date(2026, 0, 1))).toBe(false);
        expect(toStorePayload(scheduled).published_at).toBe('2099-06-15 14:45:00');

        expect(toDatetimeLocalValue('2099-06-15 14:45:00')).toBe('2099-06-15T14:45');
        expect(fromDatetimeLocalValue('2099-06-15T14:45')).toBe('2099-06-15 14:45:00');
        expect(fromDatetimeLocalValue('')).toBeNull();
        expect(fromDatetimeLocalValue('not-a-date')).toBeNull();

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

        expect(editorStatusBadge('draft', false)).toEqual({
            color: 'amber',
            label: 'Draft',
        });
        expect(editorStatusBadge('published', true).label).toBe('Pending edits');
        expect(editorStatusBadge('published', false).color).toBe('green');
        expect(editorStatusBadge('scheduled', false).color).toBe('blue');

        expect(editorSaveActivityLabel('saving', 'draft')).toBe('Saving…');
        expect(editorSaveActivityLabel('saved', 'scheduled')).toBe('Saved');
        expect(editorSaveActivityLabel('error', 'draft')).toBe('Save failed');
        expect(editorSaveActivityLabel('saving', 'published')).toBeNull();
        expect(editorSaveActivityLabel('saved', 'published')).toBeNull();
        expect(editorSaveActivityLabel('idle', 'draft')).toBeNull();

        expect(canPublishForm({ ...postToFormState(samplePost), title: '' })).toBe(false);
        expect(canPublishForm({ ...postToFormState(samplePost), title: '   ' })).toBe(false);
        expect(canPublishForm(postToFormState(samplePost))).toBe(true);
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
