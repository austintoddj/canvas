import { mergeAttributes, Node, nodePasteRule } from '@tiptap/core';

import {
    CANVAS_EMBED_PASTE_REGEX,
    embedAttrsFromPasteMatch,
    embedSrcForStored,
    type EmbedProvider,
} from '@/lib/posts/embeds';

export type CanvasEmbedOptions = {
    HTMLAttributes: Record<string, string>;
    addPasteHandler: boolean;
};

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        canvasEmbed: {
            setCanvasEmbed: (options: { provider: EmbedProvider; src: string }) => ReturnType;
        };
    }
}

export const CanvasEmbed = Node.create<CanvasEmbedOptions>({
    name: 'canvasEmbed',

    group: 'block',

    atom: true,

    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'canvas-post-body-embed',
            },
            addPasteHandler: true,
        };
    },

    addAttributes() {
        return {
            provider: {
                default: null,
                parseHTML: (element) => element.getAttribute('data-canvas-embed'),
            },
            src: {
                default: null,
                parseHTML: (element) => element.getAttribute('data-src'),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-canvas-embed]',
                getAttrs: (element) => {
                    if (!(element instanceof HTMLElement)) {
                        return false;
                    }

                    const provider = element.getAttribute('data-canvas-embed');
                    const src = element.getAttribute('data-src');

                    if ((provider !== 'x' && provider !== 'vimeo') || !src) {
                        return false;
                    }

                    return { provider, src };
                },
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        const provider = (node.attrs.provider ?? HTMLAttributes.provider) as EmbedProvider | null;
        const src = (node.attrs.src ?? HTMLAttributes.src) as string | null;
        const embedSrc = provider && src ? embedSrcForStored(provider, src) : null;

        const wrapperAttrs = mergeAttributes(this.options.HTMLAttributes, {
            'data-canvas-embed': provider ?? '',
            'data-src': src ?? '',
            class: [this.options.HTMLAttributes.class, provider ? `canvas-post-body-embed--${provider}` : null]
                .filter(Boolean)
                .join(' '),
        });

        if (!embedSrc) {
            return ['div', wrapperAttrs];
        }

        return [
            'div',
            wrapperAttrs,
            [
                'iframe',
                {
                    src: embedSrc,
                    title: provider === 'x' ? 'Embedded post' : 'Embedded video',
                    loading: 'lazy',
                    frameborder: '0',
                    allowfullscreen: 'true',
                    allow:
                        provider === 'vimeo'
                            ? 'autoplay; fullscreen; picture-in-picture; encrypted-media'
                            : 'encrypted-media; fullscreen',
                    ...(provider === 'x' ? { scrolling: 'no' } : {}),
                },
            ],
        ];
    },

    addCommands() {
        return {
            setCanvasEmbed:
                (options) =>
                ({ commands }) => {
                    if (options.provider !== 'x' && options.provider !== 'vimeo') {
                        return false;
                    }

                    if (!options.src) {
                        return false;
                    }

                    return commands.insertContent({
                        type: this.name,
                        attrs: {
                            provider: options.provider,
                            src: options.src,
                        },
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
                find: CANVAS_EMBED_PASTE_REGEX,
                type: this.type,
                getAttributes: (match) => embedAttrsFromPasteMatch(match),
            }),
        ];
    },
});
