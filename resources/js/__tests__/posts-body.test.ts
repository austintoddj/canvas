// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import { bodyFromEditorHtml, bodyHtmlForEditor, normalizeBodyHtml, rewriteBodyImageSrcs } from '@/lib/posts/body';
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

    it('rewrites public storage image srcs to the current browser origin for the editor', () => {
        const html =
            '<p><img src="https://app.test/storage/canvas/images/a.jpg" alt="A" class="canvas-post-body-image"></p>';
        const expectedSrc = `${window.location.origin}/storage/canvas/images/a.jpg`;

        expect(rewriteBodyImageSrcs(html)).toContain(`src="${expectedSrc}"`);
        expect(bodyHtmlForEditor(html)).toContain(`src="${expectedSrc}"`);
        expect(rewriteBodyImageSrcs('<p><img src="https://cdn.example.com/x.jpg" alt=""></p>')).toContain(
            'src="https://cdn.example.com/x.jpg"'
        );
    });

    it('round-trips through form payload for autosave', () => {
        const html = '<p>Written in the editor</p>';
        const body = bodyFromEditorHtml(html);

        expect(toStorePayload(postToFormState({ ...samplePost, body })).body).toBe(html);
        expect(toStorePayload(postToFormState({ ...samplePost, body: bodyFromEditorHtml('<p></p>') })).body).toBeNull();
    });
});
