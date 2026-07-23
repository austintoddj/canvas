import { describe, expect, it } from 'vitest';

import {
    AI_FIELD_PENDING_CLASS,
    AI_FIELD_SETTLED_CLASS,
    AI_REWRITE_PENDING_CLASS,
    AI_REWRITE_SETTLED_CLASS,
    rangeAfterPlainTextReplace,
} from '@/lib/posts/ai-rewrite-decoration';

describe('ai rewrite decorations', () => {
    it('maps plain-text replace into a document range', () => {
        expect(rangeAfterPlainTextReplace(10, 'Hello')).toEqual({ from: 10, to: 15 });
        expect(rangeAfterPlainTextReplace(0, '')).toEqual({ from: 0, to: 0 });
    });

    it('exports decoration class names for CSS', () => {
        expect(AI_REWRITE_PENDING_CLASS).toBe('canvas-ai-rewrite-pending');
        expect(AI_REWRITE_SETTLED_CLASS).toBe('canvas-ai-rewrite-settled');
        expect(AI_FIELD_PENDING_CLASS).toBe('canvas-ai-field-pending');
        expect(AI_FIELD_SETTLED_CLASS).toBe('canvas-ai-field-settled');
    });
});
