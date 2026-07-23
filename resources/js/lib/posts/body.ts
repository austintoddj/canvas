import { resolveMediaUrl } from '@/lib/media/list';

/**
 * Normalize TipTap / contenteditable HTML for storage.
 * Empty documents become null so the API stores a clean draft body.
 */
export function normalizeBodyHtml(html: string | null | undefined): string | null {
    if (html === null || html === undefined) {
        return null;
    }

    const trimmed = html.trim();

    if (trimmed === '') {
        return null;
    }

    const withoutEmptyBlocks = trimmed
        .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
        .replace(/<p><\/p>/gi, '')
        .trim();

    if (withoutEmptyBlocks === '') {
        return null;
    }

    return trimmed;
}

/**
 * Rewrite public-disk image `src` values so they load when APP_URL host/scheme
 * differs from the browser origin (common local misconfig).
 */
export function rewriteBodyImageSrcs(html: string): string {
    return html.replace(
        /(<img\b[^>]*\bsrc=["'])([^"']+)(["'])/gi,
        (_match, prefix: string, src: string, suffix: string) => {
            return `${prefix}${resolveMediaUrl(src)}${suffix}`;
        }
    );
}

/**
 * HTML string suitable for TipTap `content` hydration.
 */
export function bodyHtmlForEditor(body: string | null | undefined): string {
    const normalized = normalizeBodyHtml(body);

    if (normalized === null) {
        return '';
    }

    return rewriteBodyImageSrcs(normalized);
}

/**
 * Map editor HTML into post form body state for autosave.
 */
export function bodyFromEditorHtml(html: string): string | null {
    return normalizeBodyHtml(html);
}
