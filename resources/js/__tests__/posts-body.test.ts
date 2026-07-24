// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import { bodyFromEditorHtml, bodyHtmlForEditor, normalizeBodyHtml } from '@/lib/posts/body';
import { postToFormState, toStorePayload } from '@/lib/posts/form';
import type { Post } from '@/types/api';

const samplePost: Post = {
    id: 'post-1',
    title: 'Hello World',
    slug: 'hello-world',
    summary: null,
    body: '<p>Existing body</p>',
    featured_image: null,
    featured_image_caption: null,
    published_at: null,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-02T00:00:00Z',
    views_count: 0,
    user_id: 1,
    topic_id: null,
    meta: null,
    tags: [],
    topic: undefined,
};

describe('post body HTML', () => {
    it('normalizes empty editor output to null and keeps real content', () => {
        expect(normalizeBodyHtml(null)).toBeNull();
        expect(normalizeBodyHtml('')).toBeNull();
        expect(normalizeBodyHtml('<p></p>')).toBeNull();
        expect(normalizeBodyHtml('<p><br></p>')).toBeNull();
        expect(normalizeBodyHtml('<p>Hello</p>')).toBe('<p>Hello</p>');
        expect(bodyHtmlForEditor(null)).toBe('');
        expect(bodyHtmlForEditor('<p>Keep</p>')).toBe('<p>Keep</p>');
    });

    it('passes library image srcs through unchanged for editor hydration', () => {
        const rootRelative = '<p><img src="/storage/canvas/images/a.jpg" alt="A" class="canvas-post-body-image"></p>';
        const remote = '<p><img src="https://cdn.example.com/x.jpg" alt=""></p>';

        expect(bodyHtmlForEditor(rootRelative)).toBe(rootRelative);
        expect(bodyHtmlForEditor(remote)).toBe(remote);
    });

    it('round-trips through form payload for autosave', () => {
        const html = '<p>Written in the editor</p>';
        const body = bodyFromEditorHtml(html);

        expect(toStorePayload(postToFormState({ ...samplePost, body })).body).toBe(html);
        expect(toStorePayload(postToFormState({ ...samplePost, body: bodyFromEditorHtml('<p></p>') })).body).toBeNull();
    });
});
