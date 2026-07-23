export type AnalyticsIconKind = 'referer' | 'browser' | 'time';

export type AnalyticsFallbackKind = 'globe' | 'link' | 'browser' | 'clock' | 'world';

export type ResolvedAnalyticsMark =
    | {
          type: 'logo';
          src: string;
          alt: string;
      }
    | {
          type: 'fallback';
          fallback: AnalyticsFallbackKind;
      };

const BROWSER_LOGO_HOSTS: Record<string, string> = {
    chrome: 'chrome',
    firefox: 'firefox',
    safari: 'safari',
    edge: 'edge',
    opera: 'opera',
};

/** Official browser logo PNGs (not monoline icon fonts). */
function browserLogoUrl(slug: string): string {
    return `https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/${slug}/${slug}_48x48.png`;
}

/** Site favicon / app icon for a hostname. */
export function logoUrlForHost(host: string): string {
    const clean = host.replace(/^www\./i, '').toLowerCase();

    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=64`;
}

export function hostFromLabel(label: string): string | null {
    const trimmed = label.trim();

    if (trimmed === '' || /^direct$/i.test(trimmed) || /^other$/i.test(trimmed)) {
        return null;
    }

    try {
        const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        const host = new URL(withProtocol).hostname.replace(/^www\./i, '');

        return host === '' ? null : host;
    } catch {
        const loose =
            trimmed
                .replace(/^www\./i, '')
                .split('/')[0]
                ?.trim() ?? '';

        return loose.includes('.') ? loose.toLowerCase() : null;
    }
}

/**
 * Prefer real brand marks (favicons / browser logo PNGs).
 * Generic rows (Direct, Other, reading times) use local icon fallbacks.
 */
export function resolveAnalyticsMark(kind: AnalyticsIconKind, label: string): ResolvedAnalyticsMark {
    if (kind === 'time') {
        return { type: 'fallback', fallback: 'clock' };
    }

    if (kind === 'browser') {
        const key = label.trim().toLowerCase();
        const slug = BROWSER_LOGO_HOSTS[key];

        if (slug) {
            return {
                type: 'logo',
                src: browserLogoUrl(slug),
                alt: label,
            };
        }

        return { type: 'fallback', fallback: 'browser' };
    }

    const lower = label.trim().toLowerCase();

    if (lower === 'direct') {
        return { type: 'fallback', fallback: 'link' };
    }

    if (lower === '' || lower === 'other') {
        return { type: 'fallback', fallback: 'world' };
    }

    const host = hostFromLabel(label);

    if (host === null) {
        return { type: 'fallback', fallback: 'globe' };
    }

    return {
        type: 'logo',
        src: logoUrlForHost(host),
        alt: host,
    };
}
