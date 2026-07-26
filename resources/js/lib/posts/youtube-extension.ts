/**
 * TipTap YouTube with safe, browser-friendly iframe output.
 *
 * Upstream @tiptap/extension-youtube:
 * - Calls `url.match()` with no null guard → white-screens the editor on empty src
 * - Dumps extension options onto the iframe as HTML attributes (`origin=""`,
 *   `autoplay="false"`, `modestbranding="true"`, …) which can break the player
 *   or leave a gray 16:9 shell with no working embed
 *
 * We keep paste rules / schema / commands from TipTap and own `renderHTML` only.
 */

import Youtube, { getEmbedUrlFromYoutubeUrl } from '@tiptap/extension-youtube';

const YOUTUBE_IFRAME_ALLOW =
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

function resolveEmbedSrc(raw: unknown, options: {
    nocookie: boolean;
    modestBranding: boolean;
    controls: boolean;
    allowFullscreen: boolean;
    start?: number;
}): string | null {
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
            startAt: options.start ?? 0,
            rel: 0,
        });

        return typeof embedUrl === 'string' && embedUrl.trim() !== '' ? embedUrl : null;
    } catch {
        // Upstream may throw if `url` is non-string; never take down the editor.
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
            const start =
                typeof node?.attrs?.start === 'number'
                    ? node.attrs.start
                    : typeof HTMLAttributes.start === 'number'
                      ? HTMLAttributes.start
                      : 0;

            const embedSrc = resolveEmbedSrc(HTMLAttributes.src ?? node?.attrs?.src, {
                nocookie: this.options.nocookie,
                modestBranding: this.options.modestBranding,
                controls: this.options.controls,
                allowFullscreen: this.options.allowFullscreen !== false,
                start,
            });

            // Empty shell: keep the 16:9 CSS box, never call upstream match(null).
            if (embedSrc === null) {
                return ['div', { 'data-youtube-video': '', 'data-invalid-youtube': 'true' }];
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
                        // Decorative; CSS owns responsive layout.
                        width: String(this.options.width ?? 640),
                        height: String(this.options.height ?? 360),
                        allow: YOUTUBE_IFRAME_ALLOW,
                        allowfullscreen: 'true',
                        // Required by YouTube for many embeds (Error 153 when missing/blocked).
                        referrerpolicy: 'strict-origin-when-cross-origin',
                        frameborder: '0',
                        loading: 'lazy',
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
        // Dimensions are decorative; CSS on div[data-youtube-video] owns layout.
        width: 640,
        height: 360,
        // Class only on the iframe — never treat this as the 16:9 box.
        HTMLAttributes: {
            class: 'canvas-post-body-youtube-iframe',
        },
    });
}
