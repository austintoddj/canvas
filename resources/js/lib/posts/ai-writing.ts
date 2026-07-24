import type { JSONContent } from '@tiptap/core';

import type { AiRewriteAction } from '@/lib/api/ai';

export type AiWritingMenuAction = Exclude<AiRewriteAction, 'custom' | 'suggest_seo'>;

/** Block separator when flattening a multi-node editor selection for AI. */
export const AI_SELECTION_BLOCK_SEPARATOR = '\n\n';

export const AI_WRITING_ACTIONS: { action: AiWritingMenuAction; labelKey: string }[] = [
    { action: 'improve', labelKey: 'editor.ai_improve' },
    { action: 'fix_grammar', labelKey: 'editor.ai_grammar' },
    { action: 'shorten', labelKey: 'editor.ai_shorten' },
    { action: 'expand', labelKey: 'editor.ai_expand' },
];

export const AI_ERROR_CODE_KEYS: Record<string, string> = {
    ai_not_configured: 'editor.ai_not_configured',
    ai_timeout: 'editor.ai_timeout',
    ai_unreachable: 'editor.ai_timeout',
    ai_rate_limited: 'editor.ai_rate_limited',
    ai_unauthorized: 'editor.ai_unauthorized',
    ai_forbidden: 'editor.ai_forbidden',
    ai_model_not_found: 'editor.ai_model_not_found',
    ai_empty: 'editor.ai_empty_result',
    ai_failed: 'editor.ai_failed',
};

export function selectionText(from: number, to: number, textBetween: (from: number, to: number) => string): string {
    if (from === to) {
        return '';
    }

    return textBetween(from, to).trim();
}

/**
 * Map plain-text AI output into TipTap paragraph nodes.
 * Blank lines separate paragraphs; single newlines within a block become spaces.
 * Using JSON content (not a raw string) forces TipTap's block replace path so
 * multi-paragraph rewrites do not collapse into one text node.
 */
export function plainTextToEditorContent(text: string): JSONContent[] {
    const normalized = text.replace(/\r\n/g, '\n').trim();

    if (normalized === '') {
        return [{ type: 'paragraph' }];
    }

    const blocks = normalized
        .split(/\n\s*\n+/)
        .map((block) =>
            block
                .replace(/\n+/g, ' ')
                .replace(/[ \t]+/g, ' ')
                .trim()
        )
        .filter((block) => block !== '');

    if (blocks.length === 0) {
        return [{ type: 'paragraph' }];
    }

    return blocks.map((block) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: block }],
    }));
}

export function rewriteErrorCode(error: unknown): string | null {
    if (typeof error !== 'object' || error === null || !('body' in error)) {
        return null;
    }

    const body = (error as { body: unknown }).body;

    if (typeof body !== 'object' || body === null || !('code' in body)) {
        return null;
    }

    const code = (body as { code: unknown }).code;

    return typeof code === 'string' && code.trim() !== '' ? code : null;
}

export function rewriteErrorMessage(
    error: unknown,
    fallback = 'Unable to rewrite selection.',
    translate?: (key: string, fallback?: string) => string
): string {
    const code = rewriteErrorCode(error);
    const codeKey = code !== null ? AI_ERROR_CODE_KEYS[code] : undefined;

    if (codeKey !== undefined && translate !== undefined) {
        return translate(codeKey, fallback);
    }

    if (typeof error !== 'object' || error === null || !('body' in error)) {
        return fallback;
    }

    const body = (error as { body: unknown }).body;

    if (typeof body !== 'object' || body === null) {
        return fallback;
    }

    if ('error' in body && typeof body.error === 'string' && body.error.trim() !== '') {
        return body.error;
    }

    if ('errors' in body && typeof body.errors === 'object' && body.errors !== null) {
        for (const messages of Object.values(body.errors as Record<string, unknown>)) {
            if (Array.isArray(messages) && typeof messages[0] === 'string' && messages[0].trim() !== '') {
                return messages[0];
            }
        }
    }

    if ('message' in body && typeof body.message === 'string' && body.message.trim() !== '') {
        return body.message;
    }

    return fallback;
}
