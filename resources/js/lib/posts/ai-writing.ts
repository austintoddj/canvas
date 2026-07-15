import type { AiRewriteAction } from '@/lib/api/ai';

export type AiWritingMenuAction = Exclude<AiRewriteAction, 'custom'>;

export const AI_WRITING_ACTIONS: { action: AiWritingMenuAction; labelKey: string }[] = [
    { action: 'improve', labelKey: 'editor.ai_improve' },
    { action: 'fix_grammar', labelKey: 'editor.ai_grammar' },
    { action: 'shorten', labelKey: 'editor.ai_shorten' },
    { action: 'expand', labelKey: 'editor.ai_expand' },
];

export function selectionText(from: number, to: number, textBetween: (from: number, to: number) => string): string {
    if (from === to) {
        return '';
    }

    return textBetween(from, to).trim();
}

export function rewriteErrorMessage(error: unknown, fallback = 'Unable to rewrite selection.'): string {
    if (typeof error === 'object' && error !== null && 'body' in error) {
        const body = (error as { body: unknown }).body;

        if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
            return body.error;
        }
    }

    return fallback;
}
