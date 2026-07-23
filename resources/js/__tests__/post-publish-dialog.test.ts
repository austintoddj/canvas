// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import { publishTimingSummary } from '@/lib/posts/publish-dialog';

describe('publishTimingSummary', () => {
    const labels = { now: 'Right now', laterFallback: 'Later' };
    const now = new Date('2026-07-22T12:00:00');

    it('labels immediate publish', () => {
        expect(publishTimingSummary('now', '2026-07-24T15:07', 'en', labels, now)).toBe('Right now');
    });

    it('uses relative time for a future schedule', () => {
        const summary = publishTimingSummary('later', '2026-07-24T15:07', 'en', labels, now);
        expect(summary.toLowerCase()).toMatch(/day|in /);
    });

    it('falls back when the schedule value is empty', () => {
        expect(publishTimingSummary('later', '', 'en', labels, now)).toBe('Later');
    });
});
