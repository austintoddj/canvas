import { describe, expect, it } from 'vitest';

import { computeDiffStats, computeTextDiff, stripHtml } from '@/lib/posts/text-diff';

describe('stripHtml', () => {
    it('removes tags and normalizes basic entities', () => {
        expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
        expect(stripHtml('A &amp; B')).toBe('A & B');
    });
});

describe('computeTextDiff', () => {
    it('marks added tokens as added', () => {
        const parts = computeTextDiff('Hello world', 'Hello bright world');

        expect(parts.some((part) => part.type === 'added' && part.value.includes('bright'))).toBe(true);
        expect(parts.some((part) => part.type === 'deleted')).toBe(false);
    });

    it('marks removed tokens as deleted', () => {
        const parts = computeTextDiff('Hello bright world', 'Hello world');

        expect(parts.some((part) => part.type === 'deleted' && part.value.includes('bright'))).toBe(true);
        expect(parts.some((part) => part.type === 'added')).toBe(false);
    });

    it('handles full replacement', () => {
        const parts = computeTextDiff('alpha', 'beta');

        expect(parts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'deleted', value: expect.stringContaining('alpha') }),
                expect.objectContaining({ type: 'added', value: expect.stringContaining('beta') }),
            ])
        );
    });

    it('returns empty when both sides are empty', () => {
        expect(computeTextDiff('', '')).toEqual([]);
        expect(computeTextDiff('<p></p>', '')).toEqual([]);
    });

    it('diffs html bodies as plain text', () => {
        const parts = computeTextDiff('<p>One two</p>', '<p>One three</p>');

        expect(parts.some((part) => part.type === 'deleted' && part.value.includes('two'))).toBe(true);
        expect(parts.some((part) => part.type === 'added' && part.value.includes('three'))).toBe(true);
    });
});

describe('computeDiffStats', () => {
    it('counts non-whitespace characters added and deleted', () => {
        expect(computeDiffStats('Hello world', 'Hello universe')).toEqual({
            added: 'universe'.length,
            deleted: 'world'.length,
        });
    });

    it('returns zeros when text is unchanged', () => {
        expect(computeDiffStats('Same', 'Same')).toEqual({ added: 0, deleted: 0 });
    });

    it('counts a full replacement of characters', () => {
        expect(computeDiffStats('alpha', 'beta')).toEqual({
            added: 'beta'.length,
            deleted: 'alpha'.length,
        });
    });
});
