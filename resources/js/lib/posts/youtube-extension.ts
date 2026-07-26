/**
 * TipTap YouTube with safe, browser-friendly iframe output.
 *
 * Upstream @tiptap/extension-youtube:
 * - Calls `url.match()` with no null guard → white-screens the editor on empty src
 * - Dumps extension options onto the iframe as HTML attributes (`origin=""`,
 *   `autoplay="false"`, `modestbranding="true"`, …) which can break the player
 * - Paste rule stores `match.input` (whole textblock) instead of the matched URL
 * - `getEmbedUrlFromYoutubeUrl` accepts `/live/…` via YOUTUBE_REGEX but cannot
 *   extract an ID → blank 16:9 shell with no iframe
 *
 * We keep schema / commands from TipTap and own paste + renderHTML + ID parsing.
 */

import Youtube from '@tiptap/extension-youtube';
import { nodePasteRule } from '@tiptap/core';

const YOUTUBE_IFRAME_ALLOW =
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

/**
 * Match share / watch / short / live / embed URLs (global for paste rules).
 * Intentionally broad; insertion is gated on successful ID extraction.
 */
const YOUTUBE_URL_GLOBAL =
    /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/(?:watch\?[^\s]*|shorts\/[\w-]+|live\/[\w-]+|embed\/[\w-]+|v\/[\w-]+|[\w-]+(?:\?[^\s]*)?)/gi;

const VIDEO_ID_RE = /^[\w-]{6,}$/;

function normalizeYoutubeUrlString(raw: string): string {
    const trimmed = raw.trim();

    if (trimmed === '') {
        return '';
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    return `https://${trimmed}`;
}

/**
 * Extract an 11-ish character YouTube video id from common URL shapes.
 */
export function extractYoutubeVideoId(raw: unknown): string | null {
    if (typeof raw !== 'string') {
        return null;
    }

    const normalized = normalizeYoutubeUrlString(raw);

    if (normalized === '') {
        return null;
    }

    try {
        const url = new URL(normalized);
        const host = url.hostname.replace(/^www\./i, '').toLowerCase();

        if (host === 'youtu.be') {
            const id = url.pathname.split('/').filter(Boolean)[0] ?? '';

            return VIDEO_ID_RE.test(id) ? id : null;
        }

        if (
            host !== 'youtube.com' &&
            host !== 'm.youtube.com' &&
            host !== 'music.youtube.com' &&
            host !== 'youtube-nocookie.com'
        ) {
            return null;
        }

        const fromQuery = url.searchParams.get('v');

        if (fromQuery && VIDEO_ID_RE.test(fromQuery)) {
            return fromQuery;
        }

        const parts = url.pathname.split('/').filter(Boolean);
        const kind = parts[0]?.toLowerCase();
        const candidate = parts[1];

        if (
            candidate &&
            (kind === 'embed' || kind === 'shorts' || kind === 'live' || kind === 'v') &&
            kind !== undefined
        ) {
            // playlists use /embed/videoseries — not a single video
            if (kind === 'embed' && candidate === 'videoseries') {
                return null;
            }

            return VIDEO_ID_RE.test(candidate) ? candidate : null;
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Best-effort start offset (seconds) from `t` / `start` query params.
 */
export function extractYoutubeStartSeconds(raw: unknown): number {
    if (typeof raw !== 'string') {
        return 0;
    }

    const normalized = normalizeYoutubeUrlString(raw);

    if (normalized === '') {
        return 0;
    }

    try {
        const url = new URL(normalized);
        const startParam = url.searchParams.get('start');

        if (startParam !== null) {
            const n = Number.parseInt(startParam, 10);

            return Number.isFinite(n) && n > 0 ? n : 0;
        }

        const t = url.searchParams.get('t');

        if (t === null || t === '') {
            return 0;
        }

        // 90, 90s, 1m30s, 1h2m3s
        if (/^\d+$/.test(t)) {
            return Number.parseInt(t, 10);
        }

        const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);

        if (!match) {
            return 0;
        }

        const hours = Number.parseInt(match[1] ?? '0', 10);
        const minutes = Number.parseInt(match[2] ?? '0', 10);
        const seconds = Number.parseInt(match[3] ?? '0', 10);

        return hours * 3600 + minutes * 60 + seconds;
    } catch {
        return 0;
    }
}

export function buildYoutubeEmbedSrc(
    raw: unknown,
    options: {
        nocookie?: boolean;
        modestBranding?: boolean;
        controls?: boolean;
        allowFullscreen?: boolean;
        start?: number;
    } = {},
): string | null {
    const id = extractYoutubeVideoId(raw);

    if (id === null) {
        return null;
    }

    const base = options.nocookie === false ? 'https://www.youtube.com/embed/' : 'https://www.youtube-nocookie.com/embed/';
    const params = new URLSearchParams();

    if (options.modestBranding) {
        params.set('modestbranding', '1');
    }

    if (options.controls === false) {
        params.set('controls', '0');
    }

    if (options.allowFullscreen === false) {
        params.set('fs', '0');
    }

    params.set('rel', '0');

    const start =
        typeof options.start === 'number' && options.start > 0
            ? options.start
            : extractYoutubeStartSeconds(raw);

    if (start > 0) {
        params.set('start', String(start));
    }

    const query = params.toString();

    return query === '' ? `${base}${id}` : `${base}${id}?${query}`;
}

/**
 * Configured YouTube extension for the post editor.
 * Drop-in replacement for `Youtube.configure(...)`.
 */
export function createCanvasYoutubeExtension() {
    return Youtube.extend({
        // Align with CanvasIframe: leaf media block, not an editable text container.
        atom: true,

        addPasteRules() {
            if (!this.options.addPasteHandler) {
                return [];
            }

            return [
                nodePasteRule({
                    find: YOUTUBE_URL_GLOBAL,
                    type: this.type,
                    getAttributes: (match) => {
                        // Use the matched URL, not match.input (entire textblock).
                        const src = (match[0] ?? '').trim();
                        const id = extractYoutubeVideoId(src);

                        if (id === null) {
                            // Skip insert — leave plain text / link instead of a blank shell.
                            return false;
                        }

                        const start = extractYoutubeStartSeconds(src);

                        return start > 0 ? { src, start } : { src };
                    },
                }),
            ];
        },

        renderHTML({ HTMLAttributes, node }) {
            const rawSrc = (node?.attrs?.src ?? HTMLAttributes.src) as unknown;
            const startAttr =
                typeof node?.attrs?.start === 'number'
                    ? node.attrs.start
                    : typeof HTMLAttributes.start === 'number'
                      ? HTMLAttributes.start
                      : 0;

            const embedSrc = buildYoutubeEmbedSrc(rawSrc, {
                nocookie: this.options.nocookie,
                modestBranding: this.options.modestBranding,
                controls: this.options.controls,
                allowFullscreen: this.options.allowFullscreen !== false,
                start: startAttr > 0 ? startAttr : undefined,
            });

            // Compact invalid marker (not a full 16:9 slab). Never call upstream match(null).
            if (embedSrc === null) {
                const fallback =
                    typeof rawSrc === 'string' && rawSrc.trim() !== '' ? rawSrc.trim() : null;

                if (fallback !== null) {
                    return [
                        'div',
                        {
                            'data-youtube-video': '',
                            'data-invalid-youtube': 'true',
                            class: 'canvas-post-body-youtube-invalid',
                        },
                        ['a', { href: fallback, target: '_blank', rel: 'noopener noreferrer' }, fallback],
                    ];
                }

                return [
                    'div',
                    {
                        'data-youtube-video': '',
                        'data-invalid-youtube': 'true',
                        class: 'canvas-post-body-youtube-invalid',
                    },
                ];
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
