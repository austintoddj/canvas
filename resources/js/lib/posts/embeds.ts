/**
 * Generic iframe embed resolution for the post editor.
 *
 * YouTube is handled by TipTap's first-party extension — this module only
 * upgrades a small set of well-known share URLs into iframe-ready `src` values
 * (and accepts URLs that are already embed endpoints). Nothing is stored as a
 * provider enum; the node schema is just `{ src }`.
 */

export type ResolvedIframeEmbed = {
    /** iframe-ready embed URL stored on the node. */
    src: string;
    /** Display layout hint derived at resolve time (not a platform enum). */
    layout: 'video' | 'card';
};

const X_STATUS =
    /^(?:https?:)?\/\/(?:(?:www|mobile)\.)?(?:twitter\.com|x\.com)\/(?:[A-Za-z0-9_]+|i\/web)\/status\/(\d+)(?:[/?#]|$)/i;

const VIMEO_PLAYER = /^(?:https?:)?\/\/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)(?:[/?#]|$)/i;

const VIMEO_PATH =
    /^(?:https?:)?\/\/(?:www\.)?vimeo\.com\/(?:channels\/[^/]+\/|groups\/[^/]+\/videos\/|ondemand\/[^/]+\/)?(\d+)(?:[/?#]|$)/i;

/** Already-iframe-ready embed hosts (paste as-is). */
const EMBED_ENDPOINT =
    /^(?:https?:)?\/\/(?:player\.vimeo\.com\/video\/|platform\.twitter\.com\/embed\/|www\.youtube(?:-nocookie)?\.com\/embed\/|youtube(?:-nocookie)?\.com\/embed\/)/i;

function stripTrailingPunctuation(url: string): string {
    return url.trim().replace(/[.,;:!?)]+$/u, '');
}

function normalizeCandidate(input: string): string {
    const trimmed = stripTrailingPunctuation(input);

    if (trimmed === '') {
        return '';
    }

    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) {
        return trimmed;
    }

    return `https://${trimmed}`;
}

function toAbsoluteHttps(url: string): string {
    if (url.startsWith('//')) {
        return `https:${url}`;
    }

    return url;
}

function resolveX(url: string): ResolvedIframeEmbed | null {
    const match = url.match(X_STATUS);

    if (!match?.[1]) {
        return null;
    }

    return {
        src: `https://platform.twitter.com/embed/Tweet.html?id=${match[1]}`,
        layout: 'card',
    };
}

function resolveVimeo(url: string): ResolvedIframeEmbed | null {
    const match = url.match(VIMEO_PLAYER) ?? url.match(VIMEO_PATH);

    if (!match?.[1]) {
        return null;
    }

    return {
        src: `https://player.vimeo.com/video/${match[1]}`,
        layout: 'video',
    };
}

function resolveEmbedEndpoint(url: string): ResolvedIframeEmbed | null {
    if (!EMBED_ENDPOINT.test(url)) {
        return null;
    }

    const src = toAbsoluteHttps(url);
    const layout = /twitter\.com\/embed|Tweet\.html/i.test(src) ? 'card' : 'video';

    return { src, layout };
}

/**
 * Resolve a pasted URL into an iframe-ready embed `src`.
 * Returns null for ordinary links (and YouTube — leave those to TipTap Youtube).
 */
export function resolveIframeEmbedFromUrl(input: string): ResolvedIframeEmbed | null {
    const url = normalizeCandidate(input);

    if (url === '') {
        return null;
    }

    // YouTube stays on the first-party extension.
    if (/(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(url) && !/\/embed\//i.test(url)) {
        return null;
    }

    return resolveX(url) ?? resolveVimeo(url) ?? resolveEmbedEndpoint(url);
}

/**
 * Layout class for CSS (card vs 16:9 video). Host sniffing is display-only.
 */
export function iframeLayoutFromSrc(src: string): 'video' | 'card' {
    if (/twitter\.com\/embed|Tweet\.html/i.test(src)) {
        return 'card';
    }

    return 'video';
}

/**
 * Paste-rule finder: share URLs we can upgrade to iframe embeds (not YouTube).
 * Already-embed endpoints are included so re-paste of stored iframe src works.
 */
export const CANVAS_IFRAME_PASTE_REGEX =
    /(?:https?:\/\/)?(?:(?:www|mobile)\.)?(?:twitter\.com|x\.com)\/(?:[A-Za-z0-9_]+|i\/web)\/status\/\d+(?:\S*)?|(?:https?:\/\/)?(?:(?:www|player)\.)?vimeo\.com\/(?:channels\/[^/\s]+\/|groups\/[^/\s]+\/videos\/|ondemand\/[^/\s]+\/|video\/)?\d+(?:\S*)?|(?:https?:\/\/)?platform\.twitter\.com\/embed\/Tweet\.html\?[^\s]+|(?:https?:\/\/)?player\.vimeo\.com\/video\/\d+(?:\S*)?/gi;

export function iframeAttrsFromPasteMatch(match: RegExpMatchArray): { src: string } | false {
    const candidate = match[0] ?? match.input ?? '';
    const resolved = resolveIframeEmbedFromUrl(candidate);

    if (!resolved) {
        return false;
    }

    return { src: resolved.src };
}
