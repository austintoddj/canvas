// @vitest-environment happy-dom

import { Editor } from '@tiptap/react';
import { afterEach, describe, expect, it } from 'vitest';

import { createPostEditorExtensions } from '@/lib/posts/editor-extensions';
import { embedAttrsFromPasteMatch, resolveEmbedFromUrl, type ResolvedEmbed } from '@/lib/posts/embeds';

function createEditor(content = '') {
    return new Editor({
        extensions: createPostEditorExtensions(),
        content,
    });
}

function embedNodes(editor: Editor) {
    const nodes: Array<{ type: string; attrs: Record<string, unknown> }> = [];

    editor.state.doc.descendants((node) => {
        if (node.type.name === 'canvasEmbed' || node.type.name === 'youtube') {
            nodes.push({ type: node.type.name, attrs: { ...node.attrs } });
        }
    });

    return nodes;
}

describe('resolveEmbedFromUrl', () => {
    it('resolves X/Twitter status URLs to an x embed', () => {
        const cases = [
            'https://x.com/canvas/status/1234567890123456789',
            'https://twitter.com/canvas/status/1234567890123456789',
            'https://mobile.twitter.com/canvas/status/1234567890123456789',
            'https://www.x.com/i/web/status/1234567890123456789?s=20',
            'x.com/someone/status/9876543210',
        ];

        for (const input of cases) {
            const resolved = resolveEmbedFromUrl(input);
            expect(resolved, input).not.toBeNull();
            expect(resolved!.provider).toBe('x');
            expect(resolved!.src).toMatch(/status\/\d+/);
            expect(resolved!.embedSrc).toMatch(/^https:\/\/platform\.twitter\.com\/embed\/Tweet\.html\?id=\d+$/);
        }
    });

    it('resolves YouTube watch and share URLs', () => {
        const watch = resolveEmbedFromUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        const share = resolveEmbedFromUrl('https://youtu.be/dQw4w9WgXcQ');
        const shorts = resolveEmbedFromUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ');

        for (const resolved of [watch, share, shorts] as ResolvedEmbed[]) {
            expect(resolved.provider).toBe('youtube');
            expect(resolved.src).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
            expect(resolved.embedSrc).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
        }
    });

    it('resolves Vimeo URLs', () => {
        const cases = [
            'https://vimeo.com/22439234',
            'https://player.vimeo.com/video/22439234',
            'https://vimeo.com/channels/staffpicks/22439234',
            'vimeo.com/22439234',
        ];

        for (const input of cases) {
            const resolved = resolveEmbedFromUrl(input);
            expect(resolved, input).not.toBeNull();
            expect(resolved!.provider).toBe('vimeo');
            expect(resolved!.src).toBe('https://vimeo.com/22439234');
            expect(resolved!.embedSrc).toBe('https://player.vimeo.com/video/22439234');
        }
    });

    it('returns null for non-embed URLs and non-status X paths', () => {
        const negatives = [
            'https://example.com/posts/1',
            'https://example.com',
            'not a url',
            'https://x.com/canvas',
            'https://twitter.com/home',
            'https://x.com/explore',
            'https://vimeo.com/watch',
            'https://github.com/cnvs/canvas',
        ];

        for (const input of negatives) {
            expect(resolveEmbedFromUrl(input), input).toBeNull();
        }
    });

    it('builds paste attributes only for X and Vimeo', () => {
        const xMatch = 'https://x.com/a/status/1'.match(/.+/);
        const vimeoMatch = 'https://vimeo.com/9'.match(/.+/);
        const ytMatch = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'.match(/.+/);
        const randomMatch = 'https://example.com'.match(/.+/);

        expect(embedAttrsFromPasteMatch(xMatch!)).toEqual({
            provider: 'x',
            src: 'https://x.com/i/web/status/1',
        });
        expect(embedAttrsFromPasteMatch(vimeoMatch!)).toEqual({
            provider: 'vimeo',
            src: 'https://vimeo.com/9',
        });
        expect(embedAttrsFromPasteMatch(ytMatch!)).toBe(false);
        expect(embedAttrsFromPasteMatch(randomMatch!)).toBe(false);
    });
});

describe('post editor embed round-trip', () => {
    let editor: Editor | null = null;

    afterEach(() => {
        editor?.destroy();
        editor = null;
    });

    it('pastes an X status URL into a canvasEmbed node and reloads from HTML', () => {
        editor = createEditor('<p></p>');
        const url = 'https://x.com/canvas/status/1234567890123456789';

        expect(editor.view.pasteText(url)).toBe(true);

        const nodes = embedNodes(editor);
        expect(nodes).toHaveLength(1);
        expect(nodes[0]?.type).toBe('canvasEmbed');
        expect(nodes[0]?.attrs.provider).toBe('x');
        expect(String(nodes[0]?.attrs.src)).toContain('1234567890123456789');

        const html = editor.getHTML();
        expect(html).toContain('data-canvas-embed="x"');
        expect(html).toContain('platform.twitter.com/embed/Tweet.html?id=1234567890123456789');

        editor.commands.setContent(html);
        const reloaded = embedNodes(editor);
        expect(reloaded).toHaveLength(1);
        expect(reloaded[0]?.type).toBe('canvasEmbed');
        expect(reloaded[0]?.attrs.provider).toBe('x');
        expect(String(reloaded[0]?.attrs.src)).toContain('1234567890123456789');
        expect(editor.getHTML()).toContain('data-canvas-embed="x"');
    });

    it('pastes a Vimeo URL into a canvasEmbed node and reloads from HTML', () => {
        editor = createEditor('<p></p>');
        const url = 'https://vimeo.com/22439234';

        expect(editor.view.pasteText(url)).toBe(true);

        const nodes = embedNodes(editor);
        expect(nodes).toHaveLength(1);
        expect(nodes[0]?.type).toBe('canvasEmbed');
        expect(nodes[0]?.attrs.provider).toBe('vimeo');
        expect(nodes[0]?.attrs.src).toBe('https://vimeo.com/22439234');

        const html = editor.getHTML();
        expect(html).toContain('data-canvas-embed="vimeo"');
        expect(html).toContain('player.vimeo.com/video/22439234');

        editor.commands.setContent(html);
        const reloaded = embedNodes(editor);
        expect(reloaded).toHaveLength(1);
        expect(reloaded[0]?.attrs.provider).toBe('vimeo');
        expect(reloaded[0]?.attrs.src).toBe('https://vimeo.com/22439234');
    });

    it('pastes a YouTube URL into the youtube node and reloads from HTML', () => {
        editor = createEditor('<p></p>');
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

        expect(editor.view.pasteText(url)).toBe(true);

        const nodes = embedNodes(editor);
        expect(nodes).toHaveLength(1);
        expect(nodes[0]?.type).toBe('youtube');
        expect(String(nodes[0]?.attrs.src)).toContain('dQw4w9WgXcQ');

        const html = editor.getHTML();
        expect(html).toContain('data-youtube-video');
        expect(html).toMatch(/youtube-nocookie\.com\/embed\/dQw4w9WgXcQ|youtube\.com\/embed\/dQw4w9WgXcQ/);

        editor.commands.setContent(html);
        const reloaded = embedNodes(editor);
        expect(reloaded).toHaveLength(1);
        expect(reloaded[0]?.type).toBe('youtube');
    });

    it('does not force ordinary URLs into embeds', () => {
        editor = createEditor('<p></p>');
        const url = 'https://example.com/blog/hello-world';

        editor.view.pasteText(url);

        expect(embedNodes(editor)).toHaveLength(0);
        expect(editor.getHTML()).not.toContain('data-canvas-embed');
        expect(editor.getHTML()).not.toContain('data-youtube-video');
        expect(editor.getText()).toContain('example.com/blog/hello-world');
    });

    it('inserts via setCanvasEmbed command with stable HTML identity', () => {
        editor = createEditor('<p></p>');
        const ok = editor.commands.setCanvasEmbed({
            provider: 'x',
            src: 'https://x.com/i/web/status/555',
        });
        expect(ok).toBe(true);

        const html = editor.getHTML();
        editor.commands.setContent(html);
        expect(embedNodes(editor)[0]?.attrs).toMatchObject({
            provider: 'x',
            src: 'https://x.com/i/web/status/555',
        });
    });
});
