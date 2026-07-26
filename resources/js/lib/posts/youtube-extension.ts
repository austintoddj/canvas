/**
 * TipTap YouTube for Canvas: stock extension + one thin renderHTML override.
 *
 * Why override at all?
 * - Upstream `renderHTML` calls `url.match()` with no null guard → editor crash
 * - Upstream merges extension options onto the iframe as HTML attributes
 *   (`origin=""`, `autoplay="false"`, …) which is invalid markup
 *
 * We keep TipTap paste rules, schema, and `getEmbedUrlFromYoutubeUrl`.
 * Layout is CSS on `div[data-youtube-video]` only.
 */

import Youtube, { getEmbedUrlFromYoutubeUrl } from '@tiptap/extension-youtube';

const YOUTUBE_IFRAME_ALLOW =
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

function embedSrcFromNodeSrc(
    raw: unknown,
    options: {
        allowFullscreen: boolean;
        controls: boolean;
        modestBranding: boolean;
        nocookie: boolean;
        startAt: number;
    }
): string | null {
    if (typeof raw !== 'string') {
        return null;
    }

    const url = raw.trim();

    if (url === '') {
        return null;
    }

    try {
        const embedUrl = getEmbedUrlFromYoutubeUrl({
            url,
            allowFullscreen: options.allowFullscreen,
            autoplay: false,
            controls: options.controls,
            modestBranding: options.modestBranding,
            nocookie: options.nocookie,
            startAt: options.startAt,
            rel: 0,
        });

        return typeof embedUrl === 'string' && embedUrl.trim() !== '' ? embedUrl : null;
    } catch {
        return null;
    }
}

/**
 * Configured YouTube extension for the post editor.
 * Drop-in replacement for `Youtube.configure(...)`.
 */
export function createCanvasYoutubeExtension() {
    return Youtube.extend({
        renderHTML({ HTMLAttributes, node }) {
            const rawSrc = node?.attrs?.src ?? HTMLAttributes.src;
            const startAt =
                typeof node?.attrs?.start === 'number'
                    ? node.attrs.start
                    : typeof HTMLAttributes.start === 'number'
                      ? HTMLAttributes.start
                      : 0;

            const embedSrc = embedSrcFromNodeSrc(rawSrc, {
                allowFullscreen: this.options.allowFullscreen !== false,
                controls: this.options.controls,
                modestBranding: this.options.modestBranding,
                nocookie: this.options.nocookie,
                startAt: startAt > 0 ? startAt : 0,
            });

            // No iframe: keep a leaf marker so the schema stays valid, but do not
            // paint a fake player (CSS hides empty shells).
            if (embedSrc === null) {
                return ['div', { 'data-youtube-video': '' }];
            }

            return [
                'div',
                { 'data-youtube-video': '' },
                [
                    'iframe',
                    {
                        src: embedSrc,
                        class: 'canvas-post-body-youtube-iframe',
                        title: 'YouTube video',
                        width: String(this.options.width ?? 640),
                        height: String(this.options.height ?? 360),
                        allow: YOUTUBE_IFRAME_ALLOW,
                        allowfullscreen: 'true',
                        referrerpolicy: 'strict-origin-when-cross-origin',
                        frameborder: '0',
                    },
                ],
            ];
        },
    }).configure({
        addPasteHandler: true,
        controls: true,
        nocookie: true,
        modestBranding: true,
        allowFullscreen: true,
        width: 640,
        height: 360,
        // Applied by stock TipTap to the iframe only; we set class in renderHTML too.
        HTMLAttributes: {
            class: 'canvas-post-body-youtube-iframe',
        },
    });
}
