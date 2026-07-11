import { describe, expect, it } from 'vitest';

import { bodyFromEditorHtml, bodyHtmlForEditor, normalizeBodyHtml } from '@/lib/posts/body';
import { postToFormState, toStorePayload } from '@/lib/posts/form';
import editorSource from '@/pages/Posts/Editor.tsx?raw';
import bodyEditorSource from '@/components/posts/PostBodyEditor.tsx?raw';
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

describe('normalizeBodyHtml', () => {
    it('returns null for empty or blank editor documents', () => {
        expect(normalizeBodyHtml(null)).toBeNull();
        expect(normalizeBodyHtml('')).toBeNull();
        expect(normalizeBodyHtml('   ')).toBeNull();
        expect(normalizeBodyHtml('<p></p>')).toBeNull();
        expect(normalizeBodyHtml('<p><br></p>')).toBeNull();
        expect(normalizeBodyHtml('<p>&nbsp;</p>')).toBeNull();
    });

    it('keeps real HTML content', () => {
        expect(normalizeBodyHtml('<p>Hello</p>')).toBe('<p>Hello</p>');
        expect(normalizeBodyHtml('<h2>Title</h2><p>Body</p>')).toBe('<h2>Title</h2><p>Body</p>');
    });
});

describe('bodyHtmlForEditor / bodyFromEditorHtml', () => {
    it('hydrates null body as empty string for TipTap content', () => {
        expect(bodyHtmlForEditor(null)).toBe('');
        expect(bodyHtmlForEditor('<p>Keep</p>')).toBe('<p>Keep</p>');
    });

    it('round-trips editor HTML into form body for autosave payload', () => {
        const html = '<p>Written in the editor</p>';
        const body = bodyFromEditorHtml(html);
        const form = postToFormState({ ...samplePost, body });
        const payload = toStorePayload(form);

        expect(body).toBe(html);
        expect(payload.body).toBe(html);
    });

    it('stores empty editor output as null through the form payload path', () => {
        const body = bodyFromEditorHtml('<p></p>');
        const form = postToFormState({ ...samplePost, body });
        const payload = toStorePayload({ ...form, body });

        expect(body).toBeNull();
        expect(payload.body).toBeNull();
    });
});

describe('post editor ships TipTap (source)', () => {
    it('wires PostBodyEditor on create/edit', () => {
        expect(editorSource).toContain('PostBodyEditor');
        expect(editorSource).not.toContain('BodyEditorPlaceholder');
        expect(bodyEditorSource).toContain('@tiptap/react');
        expect(bodyEditorSource).toContain('useEditor');
        expect(bodyEditorSource).toContain('data-post-body-editor');
    });

    it('uses a layout-matched editor skeleton instead of Loading post text', () => {
        expect(editorSource).toContain('data-post-editor-skeleton');
        expect(editorSource).toContain('aria-busy');
        expect(editorSource).not.toContain('Loading post…');
    });

    it('exposes toolbar toggle state and a dialog for links', () => {
        expect(bodyEditorSource).toContain('aria-pressed');
        expect(bodyEditorSource).toContain('data-post-link-dialog');
        expect(bodyEditorSource).toContain('Dialog');
        expect(bodyEditorSource).not.toContain('window.prompt');
    });

    it('bootstraps new posts from create() and skips show() for unsaved UUIDs', () => {
        expect(editorSource).toContain('formFromCreateResponse');
        expect(editorSource).toContain('bootstrappedPostId');
        expect(editorSource).toContain('postsApi.create');
    });
});
