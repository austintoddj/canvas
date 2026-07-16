import type { AiRewriteAction } from '@/lib/api/ai';

export type AiWritingMenuAction = Exclude<AiRewriteAction, 'custom' | 'suggest_seo'>;

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
