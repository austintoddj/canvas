// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';

import {
    applyCardIframeHeight,
    CARD_IFRAME_PLACEHOLDER_HEIGHT_PX,
    installCardIframeResize,
    isCardIframeAtPlaceholderHeight,
    isTwitterEmbedOrigin,
    nudgeCardIframeResize,
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

    it('sizes multiple cards via placeholder fallback when source is null', () => {
        root = document.createElement('div');
        document.body.appendChild(root);

        const a = document.createElement('iframe');
        a.src = 'https://platform.twitter.com/embed/Tweet.html?id=1';
        const b = document.createElement('iframe');
        b.src = 'https://platform.twitter.com/embed/Tweet.html?id=2';
        root.appendChild(a);
        root.appendChild(b);

        unsubscribe = installCardIframeResize(root, { nudge: false });

        const fire = (height: number) => {
            window.dispatchEvent(
                new MessageEvent('message', {
                    origin: 'https://platform.twitter.com',
                    data: {
                        'twttr.embed': {
                            method: 'twttr.private.resize',
                            params: [{ height, width: 550 }],
                        },
                    },
                    source: null,
                })
            );
        };

        fire(400);
        expect(a.style.height).toBe('400px');
        expect(isCardIframeAtPlaceholderHeight(a)).toBe(false);
        expect(isCardIframeAtPlaceholderHeight(b)).toBe(true);

        fire(612);
        expect(b.style.height).toBe('612px');
        expect(a.style.height).toBe('400px');
    });

    it('nudgeCardIframeResize force-reloads by clearing src first', () => {
        root = document.createElement('div');
        document.body.appendChild(root);

        const iframe = document.createElement('iframe');
        const src = 'https://platform.twitter.com/embed/Tweet.html?id=99';
        iframe.setAttribute('src', src);
        applyCardIframeHeight(iframe, 640);
        root.appendChild(iframe);

        const srcWrites: string[] = [];
        const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
        const removeSpy = iframe.removeAttribute.bind(iframe);
        iframe.removeAttribute = (name: string) => {
            if (name === 'src') {
                srcWrites.push('__cleared__');
            }
            return removeSpy(name);
        };

        // Track property writes used to start a real navigation after clear.
        Object.defineProperty(iframe, 'src', {
            configurable: true,
            get() {
                return descriptor?.get?.call(iframe) ?? src;
            },
            set(value: string) {
                srcWrites.push(String(value));
                descriptor?.set?.call(iframe, value);
            },
        });

        nudgeCardIframeResize(root);

        expect(srcWrites[0]).toBe('__cleared__');
        expect(srcWrites).toContain(src);
        // Measured height must be cleared so placeholder fallback can re-run.
        expect(iframe.style.height).toBe('');
        expect(iframe.style.minHeight).toBe('');
        expect(iframe.getAttribute('height')).toBeNull();
        expect(iframe.getAttribute('src') ?? iframe.src).toContain('Tweet.html?id=99');
    });

    it('isCardIframeAtPlaceholderHeight respects the 12rem default', () => {
        const iframe = document.createElement('iframe');
        expect(isCardIframeAtPlaceholderHeight(iframe)).toBe(true);

        applyCardIframeHeight(iframe, CARD_IFRAME_PLACEHOLDER_HEIGHT_PX);
        expect(isCardIframeAtPlaceholderHeight(iframe)).toBe(true);

        applyCardIframeHeight(iframe, CARD_IFRAME_PLACEHOLDER_HEIGHT_PX + 1);
        expect(isCardIframeAtPlaceholderHeight(iframe)).toBe(false);
    });
});
