export type EmbedProvider = 'youtube' | 'x' | 'vimeo';

export type ResolvedEmbed = {
    provider: EmbedProvider;
    /** Canonical source URL stored on the node for identity / round-trip. */
    src: string;
    /** iframe-ready embed URL. */
    embedSrc: string;
};

const YOUTUBE_HOST = /^(?:https?:)?\/\/(?:(?:www|m|music)\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)(?:\/|$)/i;

const X_STATUS =
    /^(?:https?:)?\/\/(?:(?:www|mobile)\.)?(?:twitter\.com|x\.com)\/(?:[A-Za-z0-9_]+|i\/web)\/status\/(\d+)(?:[/?#]|$)/i;

const VIMEO_PLAYER = /^(?:https?:)?\/\/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)(?:[/?#]|$)/i;

const VIMEO_PATH =
    /^(?:https?:)?\/\/(?:www\.)?vimeo\.com\/(?:channels\/[^/]+\/|groups\/[^/]+\/videos\/|ondemand\/[^/]+\/)?(\d+)(?:[/?#]|$)/i;

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

function resolveYoutube(url: string): ResolvedEmbed | null {
    if (!YOUTUBE_HOST.test(url) && !/^(?:https?:)?\/\/youtu\.be\//i.test(url)) {
        return null;
    }

    let videoId: string | null = null;

    try {
        const parsed = new URL(url.startsWith('//') ? `https:${url}` : url);
        const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

        if (host === 'youtu.be') {
            videoId = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
        } else if (
            host === 'youtube.com' ||
            host === 'm.youtube.com' ||
            host === 'music.youtube.com' ||
            host === 'youtube-nocookie.com'
        ) {
            if (
                parsed.pathname.startsWith('/embed/') ||
                parsed.pathname.startsWith('/v/') ||
                parsed.pathname.startsWith('/shorts/')
            ) {
                videoId = parsed.pathname.split('/').filter(Boolean)[1] ?? null;
            } else {
                videoId = parsed.searchParams.get('v');
            }
        }
    } catch {
        return null;
    }

    if (!videoId || !/^[\w-]{6,}$/.test(videoId)) {
        return null;
    }

    const src = `https://www.youtube.com/watch?v=${videoId}`;

    return {
        provider: 'youtube',
        src,
        embedSrc: `https://www.youtube-nocookie.com/embed/${videoId}`,
    };
}

function resolveX(url: string): ResolvedEmbed | null {
    const match = url.match(X_STATUS);

    if (!match?.[1]) {
        return null;
    }

    const id = match[1];
    const src = `https://x.com/i/web/status/${id}`;

    return {
        provider: 'x',
        src,
        embedSrc: `https://platform.twitter.com/embed/Tweet.html?id=${id}`,
    };
}

function resolveVimeo(url: string): ResolvedEmbed | null {
    const match = url.match(VIMEO_PLAYER) ?? url.match(VIMEO_PATH);

    if (!match?.[1]) {
        return null;
    }

    const id = match[1];
    const src = `https://vimeo.com/${id}`;

    return {
        provider: 'vimeo',
        src,
        embedSrc: `https://player.vimeo.com/video/${id}`,
    };
}

/**
 * Resolve a pasted or stored URL into a known rich-embed provider.
 * Returns null for ordinary links that should stay as text/autolink.
 */
export function resolveEmbedFromUrl(input: string): ResolvedEmbed | null {
    const url = normalizeCandidate(input);

    if (url === '') {
        return null;
    }

    return resolveYoutube(url) ?? resolveX(url) ?? resolveVimeo(url);
}

/** Paste-rule finder: whole-string URL matches for X and Vimeo (YouTube stays on its extension). */
export const CANVAS_EMBED_PASTE_REGEX =
    /(?:https?:\/\/)?(?:(?:www|mobile)\.)?(?:twitter\.com|x\.com)\/(?:[A-Za-z0-9_]+|i\/web)\/status\/\d+(?:\S*)?|(?:https?:\/\/)?(?:(?:www|player)\.)?vimeo\.com\/(?:channels\/[^/\s]+\/|groups\/[^/\s]+\/videos\/|ondemand\/[^/\s]+\/|video\/)?\d+(?:\S*)?/gi;

export function embedAttrsFromPasteMatch(match: RegExpMatchArray): { provider: EmbedProvider; src: string } | false {
    const candidate = match[0] ?? match.input ?? '';
    const resolved = resolveEmbedFromUrl(candidate);

    if (!resolved || resolved.provider === 'youtube') {
        return false;
    }

    return {
        provider: resolved.provider,
        src: resolved.src,
    };
}

export function embedSrcForStored(provider: EmbedProvider, src: string): string | null {
    if (provider === 'youtube') {
        return resolveYoutube(src)?.embedSrc ?? null;
    }

    if (provider === 'x') {
        return resolveX(src)?.embedSrc ?? resolveEmbedFromUrl(src)?.embedSrc ?? null;
    }

    if (provider === 'vimeo') {
        return resolveVimeo(src)?.embedSrc ?? resolveEmbedFromUrl(src)?.embedSrc ?? null;
    }

    return null;
}
