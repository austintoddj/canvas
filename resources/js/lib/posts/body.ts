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
 * HTML string suitable for TipTap `content` hydration.
 */
export function bodyHtmlForEditor(body: string | null | undefined): string {
    const normalized = normalizeBodyHtml(body);

    return normalized ?? '';
}

/**
 * Map editor HTML into post form body state for autosave.
 */
export function bodyFromEditorHtml(html: string): string | null {
    return normalizeBodyHtml(html);
}
