import { describe, expect, it } from 'vitest';

import { formatRelativeTime } from '@/lib/format-relative-time';

describe('formatRelativeTime', () => {
    const now = new Date('2026-07-17T12:00:00.000Z');

    it('returns null for empty or invalid values', () => {
        expect(formatRelativeTime(null, now)).toBeNull();
        expect(formatRelativeTime(undefined, now)).toBeNull();
        expect(formatRelativeTime('', now)).toBeNull();
        expect(formatRelativeTime('not-a-date', now)).toBeNull();
    });

    it('formats recent and older past times in English', () => {
        expect(formatRelativeTime('2026-07-17T11:59:30.000Z', now, 'en')).toMatch(/now|second/i);
        expect(formatRelativeTime('2026-07-17T11:00:00.000Z', now, 'en')).toMatch(/hour/i);
        expect(formatRelativeTime('2026-07-10T12:00:00.000Z', now, 'en')).toMatch(/day/i);
        expect(formatRelativeTime('2026-05-17T12:00:00.000Z', now, 'en')).toMatch(/month/i);
        expect(formatRelativeTime('2024-07-17T12:00:00.000Z', now, 'en')).toMatch(/year/i);
    });
});
