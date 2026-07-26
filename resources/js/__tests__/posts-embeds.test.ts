// @vitest-environment happy-dom

import { Editor } from '@tiptap/react';
import { afterEach, describe, expect, it } from 'vitest';

import { createPostEditorExtensions } from '@/lib/posts/editor-extensions';
import { iframeAttrsFromPasteMatch, resolveIframeEmbedFromUrl } from '@/lib/posts/embeds';

function createEditor(content = '') {
    return new Editor({
        extensions: createPostEditorExtensions(),
        content,
    });
}

function mediaNodes(editor: Editor) {
    const nodes: Array<{ type: string; attrs: Record<string, unknown> }> = [];

    editor.state.doc.descendants((node) => {
        if (node.type.name === 'canvasIframe' || node.type.name === 'youtube' || node.type.name === 'audio') {
            nodes.push({ type: node.type.name, attrs: { ...node.attrs } });
        }
    });

    return nodes;
}

describe('resolveIframeEmbedFromUrl', () => {
    it('resolves X/Twitter status URLs to an iframe embed src', () => {
        const cases = [
            'https://x.com/canvas/status/1234567890123456789',
            'https://twitter.com/canvas/status/1234567890123456789',
            'https://mobile.twitter.com/canvas/status/1234567890123456789',
            'https://www.x.com/i/web/status/1234567890123456789?s=20',
            'x.com/someone/status/9876543210',
        ];

        for (const input of cases) {
            const resolved = resolveIframeEmbedFromUrl(input);
            expect(resolved, input).not.toBeNull();
            expect(resolved!.layout).toBe('card');
            expect(resolved!.src).toMatch(/^https:\/\/platform\.twitter\.com\/embed\/Tweet\.html\?id=\d+$/);
        }
    });

    it('does not claim YouTube share URLs (TipTap Youtube owns those)', () => {
        expect(resolveIframeEmbedFromUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
        expect(resolveIframeEmbedFromUrl('https://youtu.be/dQw4w9WgXcQ')).toBeNull();
        expect(resolveIframeEmbedFromUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBeNull();
    });

    it('accepts YouTube embed endpoints as generic iframe src', () => {
        const resolved = resolveIframeEmbedFromUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
        expect(resolved).not.toBeNull();
        expect(resolved!.layout).toBe('video');
        expect(resolved!.src).toContain('/embed/dQw4w9WgXcQ');
    });

    it('resolves Vimeo URLs', () => {
        const cases = [
            'https://vimeo.com/22439234',
            'https://player.vimeo.com/video/22439234',
            'https://vimeo.com/channels/staffpicks/22439234',
            'vimeo.com/22439234',
        ];

        for (const input of cases) {
            const resolved = resolveIframeEmbedFromUrl(input);
            expect(resolved, input).not.toBeNull();
            expect(resolved!.layout).toBe('video');
            expect(resolved!.src).toBe('https://player.vimeo.com/video/22439234');
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
            expect(resolveIframeEmbedFromUrl(input), input).toBeNull();
        }
    });

    it('builds paste attributes only for iframe-upgradable URLs', () => {
        const xMatch = 'https://x.com/a/status/1'.match(/.+/);
        const vimeoMatch = 'https://vimeo.com/9'.match(/.+/);
        const ytMatch = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'.match(/.+/);
        const randomMatch = 'https://example.com'.match(/.+/);

        expect(iframeAttrsFromPasteMatch(xMatch!)).toEqual({
            src: 'https://platform.twitter.com/embed/Tweet.html?id=1',
        });
        expect(iframeAttrsFromPasteMatch(vimeoMatch!)).toEqual({
            src: 'https://player.vimeo.com/video/9',
        });
        expect(iframeAttrsFromPasteMatch(ytMatch!)).toBe(false);
        expect(iframeAttrsFromPasteMatch(randomMatch!)).toBe(false);
    });
});

describe('post editor media round-trip', () => {
    let editor: Editor | null = null;

    afterEach(() => {
        editor?.destroy();
        editor = null;
    });

    it('pastes an X status URL into a canvasIframe node and reloads from HTML', () => {
        editor = createEditor('<p></p>');
        const url = 'https://x.com/canvas/status/1234567890123456789';

        expect(editor.view.pasteText(url)).toBe(true);

        const nodes = mediaNodes(editor);
        expect(nodes).toHaveLength(1);
        expect(nodes[0]?.type).toBe('canvasIframe');
        expect(String(nodes[0]?.attrs.src)).toContain('Tweet.html?id=1234567890123456789');

        const html = editor.getHTML();
        expect(html).toContain('data-canvas-iframe');
        expect(html).toContain('platform.twitter.com/embed/Tweet.html?id=1234567890123456789');

        editor.commands.setContent(html);
        const reloaded = mediaNodes(editor);
        expect(reloaded).toHaveLength(1);
        expect(reloaded[0]?.type).toBe('canvasIframe');
        expect(String(reloaded[0]?.attrs.src)).toContain('1234567890123456789');
        expect(editor.getHTML()).toContain('data-canvas-iframe');
    });

    it('pastes a Vimeo URL into a canvasIframe node and reloads from HTML', () => {
        editor = createEditor('<p></p>');
        const url = 'https://vimeo.com/22439234';

        expect(editor.view.pasteText(url)).toBe(true);

        const nodes = mediaNodes(editor);
        expect(nodes).toHaveLength(1);
        expect(nodes[0]?.type).toBe('canvasIframe');
        expect(nodes[0]?.attrs.src).toBe('https://player.vimeo.com/video/22439234');

        const html = editor.getHTML();
        expect(html).toContain('data-canvas-iframe');
        expect(html).toContain('player.vimeo.com/video/22439234');

        editor.commands.setContent(html);
        const reloaded = mediaNodes(editor);
        expect(reloaded).toHaveLength(1);
        expect(reloaded[0]?.attrs.src).toBe('https://player.vimeo.com/video/22439234');
    });

    it('pastes a YouTube URL into the youtube node and reloads from HTML', () => {
        editor = createEditor('<p></p>');
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

        expect(editor.view.pasteText(url)).toBe(true);

        const nodes = mediaNodes(editor);
        expect(nodes).toHaveLength(1);
        expect(nodes[0]?.type).toBe('youtube');
        expect(String(nodes[0]?.attrs.src)).toContain('dQw4w9WgXcQ');

        const html = editor.getHTML();
        expect(html).toContain('data-youtube-video');
        expect(html).toMatch(/youtube-nocookie\.com\/embed\/dQw4w9WgXcQ|youtube\.com\/embed\/dQw4w9WgXcQ/);

        editor.commands.setContent(html);
        const reloaded = mediaNodes(editor);
        expect(reloaded).toHaveLength(1);
        expect(reloaded[0]?.type).toBe('youtube');
    });

    it('pastes an audio file URL into the audio node', () => {
        editor = createEditor('<p></p>');
        const url = 'https://example.com/podcast/episode-1.mp3';

        expect(editor.view.pasteText(url)).toBe(true);

        const nodes = mediaNodes(editor);
        expect(nodes).toHaveLength(1);
        expect(nodes[0]?.type).toBe('audio');
        expect(nodes[0]?.attrs.src).toBe(url);

        const html = editor.getHTML();
        expect(html).toMatch(/<audio[^>]+src="https:\/\/example\.com\/podcast\/episode-1\.mp3"/);
        expect(html).toContain('controls');

        editor.commands.setContent(html);
        expect(mediaNodes(editor)[0]?.type).toBe('audio');
        expect(mediaNodes(editor)[0]?.attrs.src).toBe(url);
    });

    it('does not force ordinary URLs into embeds', () => {
        editor = createEditor('<p></p>');
        const url = 'https://example.com/blog/hello-world';

        editor.view.pasteText(url);

        expect(mediaNodes(editor)).toHaveLength(0);
        expect(editor.getHTML()).not.toContain('data-canvas-iframe');
        expect(editor.getHTML()).not.toContain('data-youtube-video');
        expect(editor.getText()).toContain('example.com/blog/hello-world');
    });

    it('inserts via setIframe command with stable HTML identity', () => {
        editor = createEditor('<p></p>');
        const ok = editor.commands.setIframe({
            src: 'https://x.com/i/web/status/555',
        });
        expect(ok).toBe(true);

        const html = editor.getHTML();
        editor.commands.setContent(html);
        expect(mediaNodes(editor)[0]?.attrs).toMatchObject({
            src: 'https://platform.twitter.com/embed/Tweet.html?id=555',
        });
    });

    it('inserts via setAudio command', () => {
        editor = createEditor('<p></p>');
        const ok = editor.commands.setAudio({
            src: 'https://cdn.example.com/track.ogg',
        });
        expect(ok).toBe(true);
        expect(mediaNodes(editor)[0]?.type).toBe('audio');
        expect(mediaNodes(editor)[0]?.attrs.src).toBe('https://cdn.example.com/track.ogg');
    });
});
