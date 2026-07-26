// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';

import {
    applyCardIframeHeight,
    installCardIframeResize,
    isTwitterEmbedOrigin,
    parseTwitterEmbedResize,
    parseTwitterEmbedResizeHeight,
} from '@/lib/posts/iframe-resize';

describe('isTwitterEmbedOrigin', () => {
    it('accepts known Twitter/X embed hosts', () => {
        expect(isTwitterEmbedOrigin('https://platform.twitter.com')).toBe(true);
        expect(isTwitterEmbedOrigin('https://twitter.com')).toBe(true);
        expect(isTwitterEmbedOrigin('https://x.com')).toBe(true);
        expect(isTwitterEmbedOrigin('https://cdn.syndication.twimg.com')).toBe(true);
    });

    it('rejects unrelated origins', () => {
        expect(isTwitterEmbedOrigin('https://www.youtube.com')).toBe(false);
        expect(isTwitterEmbedOrigin('https://example.com')).toBe(false);
        expect(isTwitterEmbedOrigin('not-a-url')).toBe(false);
    });
});

describe('parseTwitterEmbedResize', () => {
    it('parses twttr.embed JSON-RPC resize payloads', () => {
        const payload = {
            'twttr.embed': {
                jsonrpc: '2.0',
                method: 'twttr.private.resize',
                params: [{ width: 550, height: 612, id: 'twitter-widget-0' }],
                id: 1,
            },
        };

        expect(parseTwitterEmbedResize(payload)).toEqual({
            height: 612,
            id: 'twitter-widget-0',
        });
        expect(parseTwitterEmbedResizeHeight(JSON.stringify(payload))).toBe(612);
    });

    it('parses array-style resize messages', () => {
        expect(parseTwitterEmbedResize(['twttr.private.resize', { height: 480, width: 550, id: 'w1' }])).toEqual({
            height: 480,
            id: 'w1',
        });
    });

    it('parses flat method + height objects', () => {
        expect(parseTwitterEmbedResize({ method: 'twttr.private.resize', height: 320 })).toEqual({
            height: 320,
            id: null,
        });
    });

    it('returns null for unrelated messages', () => {
        expect(parseTwitterEmbedResize({ hello: 'world' })).toBeNull();
        expect(parseTwitterEmbedResize('not json')).toBeNull();
        expect(parseTwitterEmbedResize(null)).toBeNull();
        expect(parseTwitterEmbedResize({ method: 'ping' })).toBeNull();
        expect(parseTwitterEmbedResizeHeight({ 'twttr.embed': { method: 'other', params: [] } })).toBeNull();
    });

    it('rejects non-positive or absurd heights', () => {
        expect(parseTwitterEmbedResizeHeight({ method: 'twttr.private.resize', height: 0 })).toBeNull();
        expect(parseTwitterEmbedResizeHeight({ method: 'twttr.private.resize', height: -5 })).toBeNull();
        expect(parseTwitterEmbedResizeHeight({ method: 'twttr.private.resize', height: 50_000 })).toBeNull();
    });
});

describe('installCardIframeResize', () => {
    let root: HTMLDivElement;
    let unsubscribe: (() => void) | null = null;

    afterEach(() => {
        unsubscribe?.();
        unsubscribe = null;
        root?.remove();
    });

    it('sets iframe height from a matching postMessage', () => {
        root = document.createElement('div');
        document.body.appendChild(root);

        const iframe = document.createElement('iframe');
        iframe.src = 'https://platform.twitter.com/embed/Tweet.html?id=123';
        root.appendChild(iframe);

        // happy-dom may not expose contentWindow the same way; use single-iframe fallback
        unsubscribe = installCardIframeResize(root);

        window.dispatchEvent(
            new MessageEvent('message', {
                origin: 'https://platform.twitter.com',
                data: {
                    'twttr.embed': {
                        method: 'twttr.private.resize',
                        params: [{ height: 734, width: 550 }],
                    },
                },
                source: null,
            })
        );

        expect(iframe.style.height).toBe('734px');
        expect(iframe.getAttribute('height')).toBe('734');
    });

    it('ignores messages from other origins', () => {
        root = document.createElement('div');
        document.body.appendChild(root);

        const iframe = document.createElement('iframe');
        iframe.src = 'https://platform.twitter.com/embed/Tweet.html?id=123';
        root.appendChild(iframe);

        unsubscribe = installCardIframeResize(root);

        window.dispatchEvent(
            new MessageEvent('message', {
                origin: 'https://evil.example',
                data: {
                    'twttr.embed': {
                        method: 'twttr.private.resize',
                        params: [{ height: 900 }],
                    },
                },
            })
        );

        expect(iframe.style.height).toBe('');
    });

    it('applyCardIframeHeight writes style and attribute', () => {
        const iframe = document.createElement('iframe');
        applyCardIframeHeight(iframe, 501.2);
        expect(iframe.style.height).toBe('502px');
        expect(iframe.style.minHeight).toBe('502px');
        expect(iframe.getAttribute('height')).toBe('502');
    });
});
