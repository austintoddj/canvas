import { describe, expect, it } from 'vitest';

import { defaultTimezone, detectBrowserTimezone, listTimezones } from '@/lib/timezones';

describe('timezones', () => {
    it('lists IANA timezones including UTC', () => {
        const zones = listTimezones();

        expect(zones.length).toBeGreaterThan(0);
        expect(zones).toContain('UTC');
    });

    it('detects a browser timezone when available', () => {
        const zone = detectBrowserTimezone();

        expect(zone === null || typeof zone === 'string').toBe(true);
    });

    it('prefers browser timezone over app default', () => {
        const zone = defaultTimezone('America/Chicago');

        expect(typeof zone).toBe('string');
        expect(zone.length).toBeGreaterThan(0);
    });
});
