/**
 * Auto-height for card-style embeds (X/Twitter Tweet.html iframes).
 *
 * Cross-origin iframes cannot size to content via CSS. Twitter posts
 * `twttr.private.resize` (and related) messages with the measured height;
 * this module applies those heights to the matching iframe.
 */

const TWITTER_ORIGINS = new Set([
    'https://platform.twitter.com',
    'https://twitter.com',
    'https://www.twitter.com',
    'https://x.com',
    'https://www.x.com',
    'https://cdn.syndication.twimg.com',
    'https://syndication.twitter.com',
]);

const CARD_IFRAME_SELECTOR = 'iframe[src*="platform.twitter.com/embed"], iframe[src*="Tweet.html"]';

/** CSS default for card iframes (`height: 12rem`) before a resize message arrives. */
export const CARD_IFRAME_PLACEHOLDER_HEIGHT_PX = 192;

export function isTwitterEmbedOrigin(origin: string): boolean {
    if (TWITTER_ORIGINS.has(origin)) {
        return true;
    }

    try {
        const host = new URL(origin).hostname;

        return (
            host === 'twitter.com' ||
            host.endsWith('.twitter.com') ||
            host === 'x.com' ||
            host.endsWith('.x.com') ||
            host.endsWith('.twimg.com')
        );
    } catch {
        return false;
    }
}

export type TwitterEmbedResizeNotice = {
    height: number;
    /** Optional widget/element id from the payload (when present). */
    id: string | null;
};

/**
 * Extract resize height (and optional widget id) from a Twitter/X embed postMessage.
 * Returns null when the message is not a resize notice.
 */
export function parseTwitterEmbedResize(data: unknown): TwitterEmbedResizeNotice | null {
    const parsed = coerceMessageData(data);

    if (parsed === null) {
        return null;
    }

    // JSON-RPC style: { "twttr.embed": { method, params: [{ height, id? }] } }
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const record = parsed as Record<string, unknown>;
        const embed = record['twttr.embed'];

        if (embed && typeof embed === 'object') {
            const rpc = embed as Record<string, unknown>;
            const method = typeof rpc.method === 'string' ? rpc.method : '';

            if (method.includes('resize') || method.includes('dimensions')) {
                const height = heightFromUnknown(rpc.params) ?? heightFromUnknown(rpc);

                if (height !== null) {
                    return { height, id: idFromUnknown(rpc.params) ?? idFromUnknown(rpc) };
                }
            }
        }

        // Flat: { method: 'twttr.private.resize', height } or { params: [...] }
        if (typeof record.method === 'string' && record.method.includes('resize')) {
            const height = heightFromUnknown(record) ?? heightFromUnknown(record.params);

            if (height !== null) {
                return { height, id: idFromUnknown(record) ?? idFromUnknown(record.params) };
            }
        }
    }

    // Array style: ["twttr.private.resize", { height }] or [method, params]
    if (Array.isArray(parsed) && parsed.length >= 2) {
        const head = parsed[0];
        const method = typeof head === 'string' ? head : '';

        if (method.includes('resize') || method.includes('twttr')) {
            const height = heightFromUnknown(parsed[1]) ?? heightFromUnknown(parsed.slice(1));

            if (height !== null) {
                return { height, id: idFromUnknown(parsed[1]) };
            }
        }
    }

    return null;
}

/** @deprecated Prefer parseTwitterEmbedResize; kept for tests/call sites that only need height. */
export function parseTwitterEmbedResizeHeight(data: unknown): number | null {
    return parseTwitterEmbedResize(data)?.height ?? null;
}

function coerceMessageData(data: unknown): unknown {
    if (typeof data !== 'string') {
        return data;
    }

    const trimmed = data.trim();

    if (trimmed === '' || (trimmed[0] !== '{' && trimmed[0] !== '[')) {
        return null;
    }

    try {
        return JSON.parse(trimmed) as unknown;
    } catch {
        return null;
    }
}

function heightFromUnknown(value: unknown): number | null {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'number') {
        return normalizeHeight(value);
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);

        return Number.isFinite(n) ? normalizeHeight(n) : null;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const h = heightFromUnknown(item);

            if (h !== null) {
                return h;
            }
        }

        return null;
    }

    if (typeof value === 'object') {
        const record = value as Record<string, unknown>;

        if ('height' in record) {
            return heightFromUnknown(record.height);
        }

        if ('data' in record) {
            return heightFromUnknown(record.data);
        }

        if ('params' in record) {
            return heightFromUnknown(record.params);
        }
    }

    return null;
}

function idFromUnknown(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        return value.trim();
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const id = idFromUnknown(item);

            if (id !== null) {
                return id;
            }
        }

        return null;
    }

    if (typeof value === 'object') {
        const record = value as Record<string, unknown>;

        if (typeof record.id === 'string' || typeof record.id === 'number') {
            return String(record.id);
        }

        if ('data' in record) {
            return idFromUnknown(record.data);
        }

        if ('params' in record) {
            return idFromUnknown(record.params);
        }
    }

    return null;
}

function normalizeHeight(value: number): number | null {
    if (!Number.isFinite(value) || value < 1) {
        return null;
    }

    // Guard against absurd values (mis-parsed payloads)
    if (value > 10_000) {
        return null;
    }

    return Math.ceil(value);
}

/**
 * Whether a card iframe is still at (or near) the CSS placeholder height.
 * Used when contentWindow/id matching fails across multiple cards.
 */
export function isCardIframeAtPlaceholderHeight(iframe: HTMLIFrameElement): boolean {
    const attr = iframe.getAttribute('height');

    if (attr !== null && attr.trim() !== '') {
        const n = Number(attr);

        if (Number.isFinite(n)) {
            return n <= CARD_IFRAME_PLACEHOLDER_HEIGHT_PX;
        }
    }

    const styleH = iframe.style.height;

    if (styleH !== null && styleH.trim() !== '') {
        const n = Number.parseFloat(styleH);

        if (Number.isFinite(n)) {
            return n <= CARD_IFRAME_PLACEHOLDER_HEIGHT_PX;
        }
    }

    // No explicit height yet — treat as placeholder (CSS default applies).
    return true;
}

function findCardIframe(
    source: MessageEventSource | null,
    root: ParentNode,
    widgetId: string | null
): HTMLIFrameElement | null {
    const iframes = Array.from(root.querySelectorAll<HTMLIFrameElement>(CARD_IFRAME_SELECTOR));

    if (iframes.length === 0) {
        return null;
    }

    if (source !== null) {
        for (const iframe of iframes) {
            if (iframe.contentWindow === source) {
                return iframe;
            }
        }
    }

    if (widgetId !== null) {
        const byId = iframes.find((iframe) => iframe.id === widgetId || iframe.name === widgetId);

        if (byId) {
            return byId;
        }
    }

    // Single card on the page: safe to target even if contentWindow matching fails
    // (e.g. cross-origin timing before the frame is fully bound).
    if (iframes.length === 1) {
        return iframes[0] ?? null;
    }

    // Multiple cards: when source/id cannot be matched (nested Twitter frames, late
    // binding), assign in document order to the next iframe still at placeholder height.
    const pending = iframes.filter((iframe) => isCardIframeAtPlaceholderHeight(iframe));

    if (pending.length > 0) {
        return pending[0] ?? null;
    }

    return null;
}

export function applyCardIframeHeight(iframe: HTMLIFrameElement, height: number): void {
    const px = `${Math.ceil(height)}px`;

    iframe.style.height = px;
    iframe.style.minHeight = px;
    iframe.setAttribute('height', String(Math.ceil(height)));
}

/**
 * Re-set card iframe `src` so Twitter re-sends resize postMessages.
 * Call after installing the listener when embeds were already in the DOM
 * (e.g. preview open) — otherwise early resize messages are missed and cards
 * stay clipped at the 12rem placeholder.
 */
export function nudgeCardIframeResize(root: ParentNode = document): void {
    const iframes = Array.from(root.querySelectorAll<HTMLIFrameElement>(CARD_IFRAME_SELECTOR));

    for (const iframe of iframes) {
        const src = iframe.getAttribute('src');

        if (src === null || src.trim() === '') {
            continue;
        }

        // Force a reload without changing the URL. Clearing first avoids some
        // browsers no-op'ing a same-src assignment.
        iframe.setAttribute('src', src);
    }
}

/**
 * Install a window message listener that sizes Twitter/X card iframes under `root`.
 * Returns an unsubscribe function.
 *
 * When `nudge` is true (default), card iframes already in `root` are reloaded so
 * resize messages fire after the listener is attached — required for preview
 * dialogs that inject HTML and then install the listener.
 */
export function installCardIframeResize(root: ParentNode = document, options: { nudge?: boolean } = {}): () => void {
    const onMessage = (event: MessageEvent) => {
        if (!isTwitterEmbedOrigin(event.origin)) {
            return;
        }

        const notice = parseTwitterEmbedResize(event.data);

        if (notice === null) {
            return;
        }

        const iframe = findCardIframe(event.source, root, notice.id);

        if (iframe === null) {
            return;
        }

        applyCardIframeHeight(iframe, notice.height);
    };

    window.addEventListener('message', onMessage);

    if (options.nudge !== false) {
        nudgeCardIframeResize(root);
    }

    return () => {
        window.removeEventListener('message', onMessage);
    };
}
