import { describe, expect, it } from 'vitest';

import { formatMonthOverMonth, parseDailyGraph, rankedEntries } from '@/lib/analytics';

describe('analytics helpers', () => {
    it('parses graphs, formats MoM, and ranks entries', () => {
        expect(
            parseDailyGraph(
                JSON.stringify({
                    '2026-06-02': 2,
                    '2026-06-01': 1,
                    '2026-06-03': 0,
                })
            )
        ).toEqual([
            { date: '2026-06-01', value: 1, label: expect.any(String) },
            { date: '2026-06-02', value: 2, label: expect.any(String) },
            { date: '2026-06-03', value: 0, label: expect.any(String) },
        ]);
        expect(parseDailyGraph('not-json')).toEqual([]);

        expect(formatMonthOverMonth({ direction: 'up', percentage: '12' })).toBe('up 12%');
        expect(formatMonthOverMonth({ direction: 'down', percentage: '100' })).toBe('down 100%');

        expect(rankedEntries({ Twitter: 4, Direct: 10, Google: 7 })).toEqual([
            ['Direct', '10'],
            ['Google', '7'],
            ['Twitter', '4'],
        ]);
    });
});
