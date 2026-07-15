import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api';
import { AI_WRITING_ACTIONS, rewriteErrorMessage, selectionText } from '@/lib/posts/ai-writing';

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
        const error = new ApiError(422, { error: 'AI is not configured.' });

        expect(rewriteErrorMessage(error)).toBe('AI is not configured.');
    });

    it('falls back when the error has no message', () => {
        expect(rewriteErrorMessage(new Error('nope'))).toBe('Unable to rewrite selection.');
    });
});
