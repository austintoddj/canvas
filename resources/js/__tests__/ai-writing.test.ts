import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api';
import {
    AI_ERROR_CODE_KEYS,
    AI_SELECTION_BLOCK_SEPARATOR,
    AI_WRITING_ACTIONS,
    plainTextToEditorContent,
    rewriteErrorCode,
    rewriteErrorDetail,
    rewriteErrorMessage,
    selectionText,
} from '@/lib/posts/ai-writing';

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

    it('uses a blank-line block separator for multi-paragraph selections', () => {
        expect(AI_SELECTION_BLOCK_SEPARATOR).toBe('\n\n');
        expect(selectionText(0, 10, (from, to) => `A${AI_SELECTION_BLOCK_SEPARATOR}B`.slice(from, to))).toBe(
            `A${AI_SELECTION_BLOCK_SEPARATOR}B`
        );
    });

    it('maps blank-line plain text into multiple TipTap paragraphs', () => {
        expect(plainTextToEditorContent('One.\n\nTwo.\n\nThree.')).toEqual([
            { type: 'paragraph', content: [{ type: 'text', text: 'One.' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Two.' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Three.' }] },
        ]);
    });

    it('collapses single newlines within a paragraph and ignores empty blocks', () => {
        expect(plainTextToEditorContent('Line one\nstill one.\n\n\nNext block.')).toEqual([
            { type: 'paragraph', content: [{ type: 'text', text: 'Line one still one.' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Next block.' }] },
        ]);
    });

    it('returns a single empty paragraph for blank AI output', () => {
        expect(plainTextToEditorContent('   ')).toEqual([{ type: 'paragraph' }]);
        expect(plainTextToEditorContent('Only one paragraph.')).toEqual([
            { type: 'paragraph', content: [{ type: 'text', text: 'Only one paragraph.' }] },
        ]);
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

    it('appends provider detail to translated primary messages', () => {
        const error = new ApiError(422, {
            error: 'server message',
            code: 'ai_context_length',
            detail: "This model's maximum context length is 8192 tokens.",
        });
        const translate = (key: string, fallback?: string) =>
            key === 'editor.ai_context_length' ? 'Text is too long for the model.' : (fallback ?? key);

        expect(rewriteErrorDetail(error)).toBe("This model's maximum context length is 8192 tokens.");
        expect(rewriteErrorMessage(error, 'fallback', translate)).toBe(
            "Text is too long for the model. (This model's maximum context length is 8192 tokens.)"
        );
    });

    it('does not double-append detail already present in the primary message', () => {
        const error = new ApiError(422, {
            error: 'Could not complete. (Upstream capacity exhausted)',
            code: 'ai_failed',
            detail: 'Upstream capacity exhausted',
        });

        expect(rewriteErrorMessage(error)).toBe('Could not complete. (Upstream capacity exhausted)');
    });

    it('maps context and quota codes through the catalog keys', () => {
        expect(AI_ERROR_CODE_KEYS.ai_context_length).toBe('editor.ai_context_length');
        expect(AI_ERROR_CODE_KEYS.ai_quota_exceeded).toBe('editor.ai_quota_exceeded');
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
