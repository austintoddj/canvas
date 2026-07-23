import { describe, expect, it } from 'vitest';

import { formatListDate } from '@/lib/format-list-date';

describe('formatListDate', () => {
    const now = new Date(2026, 6, 12, 15, 30, 0);

    it('returns em dash for empty or invalid values', () => {
        expect(formatListDate(null, now)).toBe('—');
        expect(formatListDate(undefined, now)).toBe('—');
        expect(formatListDate('', now)).toBe('—');
        expect(formatListDate('not-a-date', now)).toBe('—');
    });

    it('formats same-day times', () => {
        const todayMorning = new Date(2026, 6, 12, 11, 16, 0).toISOString();
        const formatted = formatListDate(todayMorning, now);

        expect(formatted).toMatch(/\d{1,2}:\d{2}/);
        expect(formatted).not.toMatch(/Jul|2026|\//);
    });

    it('formats same-year dates without year', () => {
        const earlierThisYear = new Date(2026, 2, 15, 12, 0, 0).toISOString();
        const formatted = formatListDate(earlierThisYear, now);

        expect(formatted).toMatch(/Mar|15/);
        expect(formatted).not.toMatch(/2026/);
    });

    it('formats older dates as d/mm/yy', () => {
        const older = new Date(2024, 6, 3, 12, 0, 0).toISOString();

        expect(formatListDate(older, now)).toBe('3/07/24');
    });
});
