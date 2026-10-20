const WORD_CHAR = /[A-Za-z0-9_]/;

function isWordChar(char: string | undefined): boolean {
    return char !== undefined && WORD_CHAR.test(char);
}

function isHtmlSpace(char: string | undefined): boolean {
    return char !== undefined && /\s/.test(char);
}

/**
 * Drop script and style elements, including their contents.
 *
 * A `/<script…/` replace is an incomplete multi-character sanitizer: one pass
 * can rebuild `<script` from a nested tag, and repeating it still matches the
 * prefix CodeQL reports. Scanning for the closing delimiter removes the same
 * spans.
 */
export function stripEmbeddedElements(html: string): string {
    return stripElement(stripElement(html, 'script'), 'style');
}

function stripElement(html: string, name: 'script' | 'style'): string {
    let current = html;
    let previous: string;

    do {
        previous = current;
        current = stripElementOnce(current, name);
    } while (current !== previous);

    return current;
}

function stripElementOnce(html: string, name: 'script' | 'style'): string {
    const lower = html.toLowerCase();
    const openToken = `<${name}`;
    const closeToken = `</${name}`;
    let cursor = 0;
    let out = '';

    while (cursor < html.length) {
        const start = lower.indexOf(openToken, cursor);

        if (start === -1) {
            out += html.slice(cursor);
            break;
        }

        const afterName = start + openToken.length;

        // `<scriptlet` is not a script element (`\b` after the tag name).
        if (isWordChar(html[afterName])) {
            out += html.slice(cursor, afterName);
            cursor = afterName;
            continue;
        }

        out += html.slice(cursor, start);

        const end = findElementEnd(html, lower, closeToken, afterName);

        if (end === -1) {
            break;
        }

        cursor = end;
    }

    return out;
}

/**
 * Index just after `</name` plus optional whitespace and `>`.
 * `-1` when the element is unclosed and the rest of the string is its content.
 */
function findElementEnd(html: string, lower: string, closeToken: string, from: number): number {
    let searchFrom = from;

    while (searchFrom < html.length) {
        const closeAt = lower.indexOf(closeToken, searchFrom);

        if (closeAt === -1) {
            return -1;
        }

        let end = closeAt + closeToken.length;

        while (isHtmlSpace(html[end])) {
            end += 1;
        }

        if (html[end] === '>') {
            return end + 1;
        }

        searchFrom = closeAt + closeToken.length;
    }

    return -1;
}

/**
 * Replace each `<…>` span. `<>` is left in place, matching `/<[^>]+>/`.
 * An index scan does not use a regexp whose prefix is `<script`.
 */
export function replaceTags(html: string, replacement: string): string {
    let out = '';
    let cursor = 0;

    while (cursor < html.length) {
        const start = html.indexOf('<', cursor);

        if (start === -1) {
            out += html.slice(cursor);
            break;
        }

        const end = html.indexOf('>', start + 1);

        if (end === -1) {
            out += html.slice(cursor);
            break;
        }

        if (end === start + 1) {
            out += html.slice(cursor, end + 1);
            cursor = end + 1;
            continue;
        }

        out += html.slice(cursor, start) + replacement;
        cursor = end + 1;
    }

    return out;
}
