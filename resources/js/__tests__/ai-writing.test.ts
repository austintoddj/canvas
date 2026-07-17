import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api';
import { AI_WRITING_ACTIONS, rewriteErrorCode, rewriteErrorMessage, selectionText } from '@/lib/posts/ai-writing';

describe('ai writing helpers', () => {
    it('lists the preset rewrite actions', () => {
        expect(AI_WRITING_ACTIONS.map((item) => item.action)).toEqual(['improve', 'fix_grammar', 'shorten', 'expand']);
    });

    it('returns empty selection text when the range is collapsed', () => {
        expect(selectionText(3, 3, () => 'ignored')).toBe('');
    });

    it('trims selection text for non-empty ranges', () => {
        expect(selectionText(0, 5, () => '  hello  ')).toBe('hello');
    });

    it('reads provider error messages from api error bodies', () => {
        const error = new ApiError(422, { error: 'AI is not configured.', code: 'ai_not_configured' });

        expect(rewriteErrorCode(error)).toBe('ai_not_configured');
        expect(rewriteErrorMessage(error)).toBe('AI is not configured.');
    });

    it('maps error codes through the translator when provided', () => {
        const error = new ApiError(422, { error: 'server message', code: 'ai_timeout' });
        const translate = (key: string, fallback?: string) =>
            key === 'editor.ai_timeout' ? 'Took too long (translated)' : (fallback ?? key);

        expect(rewriteErrorMessage(error, 'fallback', translate)).toBe('Took too long (translated)');
    });

    it('reads Laravel validation field errors', () => {
        const error = new ApiError(422, {
            message: 'The text field must not be greater than 8000 characters.',
            errors: { text: ['The text field must not be greater than 8000 characters.'] },
        });

        expect(rewriteErrorMessage(error)).toBe('The text field must not be greater than 8000 characters.');
    });

    it('reads Laravel top-level message when errors are empty', () => {
        const error = new ApiError(422, { message: 'Something went wrong.' });

        expect(rewriteErrorMessage(error)).toBe('Something went wrong.');
    });

    it('falls back when the error has no message', () => {
        expect(rewriteErrorMessage(new Error('nope'))).toBe('Unable to rewrite selection.');
    });
});
