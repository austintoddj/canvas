import { mergeAttributes, Node, nodePasteRule } from '@tiptap/core';

import { t } from '@/lib/i18n';
import {
    CANVAS_IFRAME_PASTE_REGEX,
    iframeAttrsFromPasteMatch,
    iframeLayoutFromSrc,
    resolveIframeEmbedFromUrl,
} from '@/lib/posts/embeds';

export type CanvasIframeOptions = {
    HTMLAttributes: Record<string, string>;
    addPasteHandler: boolean;
};

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        canvasIframe: {
            setIframe: (options: { src: string }) => ReturnType;
        };
    }
}

function allowForSrc(src: string): string {
    if (/twitter\.com\/embed|Tweet\.html/i.test(src)) {
        // Media posts (video/gif) need autoplay + encrypted-media; fullscreen helps expanded media.
        return 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share';
    }

    return 'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
}

/**
 * Generic block iframe for non-YouTube embeds (Vimeo, X, prebuilt embed URLs).
 * Schema is only `{ src }` — no provider enum.
 */
export const CanvasIframe = Node.create<CanvasIframeOptions>({
    name: 'canvasIframe',

    group: 'block',

    atom: true,

    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'canvas-post-body-iframe',
            },
            addPasteHandler: true,
        };
    },

    addAttributes() {
        return {
            src: {
                default: null,
                parseHTML: (element) => {
                    if (!(element instanceof HTMLElement)) {
                        return null;
                    }

                    return (
                        element.getAttribute('data-src') ?? element.querySelector('iframe')?.getAttribute('src') ?? null
                    );
                },
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-canvas-iframe]' }];
    },

    renderHTML({ node, HTMLAttributes }) {
        const src = (node.attrs.src ?? HTMLAttributes.src) as string | null;
        const layout = src ? iframeLayoutFromSrc(src) : 'video';

        const wrapperAttrs = mergeAttributes(this.options.HTMLAttributes, {
            'data-canvas-iframe': '',
            'data-src': src ?? '',
            'data-layout': layout,
            class: [
                this.options.HTMLAttributes.class,
                layout === 'card' ? 'canvas-post-body-iframe--card' : 'canvas-post-body-iframe--video',
            ]
                .filter(Boolean)
                .join(' '),
        });

        if (!src) {
            return ['div', wrapperAttrs];
        }

        return [
            'div',
            wrapperAttrs,
            [
                'iframe',
                {
                    src,
                    title: t('editor.embedded_content', 'Embedded content'),
                    // Cards need an immediate load so Twitter can post resize height;
                    // lazy deferral left multi-card previews stuck at the 12rem placeholder.
                    loading: layout === 'card' ? 'eager' : 'lazy',
                    frameborder: '0',
                    allow: allowForSrc(src),
                    ...(layout === 'card' ? { scrolling: 'no' } : {}),
                },
            ],
        ];
    },

    addCommands() {
        return {
            setIframe:
                (options) =>
                ({ commands }) => {
                    if (!options.src) {
                        return false;
                    }

                    const resolved = resolveIframeEmbedFromUrl(options.src);
                    const src = resolved?.src ?? (/^https:\/\//i.test(options.src) ? options.src : null);

                    if (!src) {
                        return false;
                    }

                    return commands.insertContent({
                        type: this.name,
                        attrs: { src },
                    });
                },
        };
    },

    addPasteRules() {
        if (!this.options.addPasteHandler) {
            return [];
        }

        return [
            nodePasteRule({
                find: CANVAS_IFRAME_PASTE_REGEX,
                type: this.type,
                getAttributes: (match) => iframeAttrsFromPasteMatch(match),
            }),
        ];
    },
});
