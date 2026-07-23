import { describe, expect, it } from 'vitest';

import {
    defaultTimezone,
    detectBrowserTimezone,
    isEssentialTimezone,
    listTimezoneOptions,
    listTimezones,
    timezoneLabel,
} from '@/lib/timezones';

describe('timezones', () => {
    it('lists only the curated essential zones', () => {
        const zones = listTimezones();

        expect(zones).toEqual([
            'UTC',
            'America/New_York',
            'America/Chicago',
            'America/Los_Angeles',
            'Europe/London',
            'Europe/Paris',
            'Asia/Kolkata',
            'Asia/Tokyo',
        ]);
    });

    it('exposes friendly labels for the catalog', () => {
        const options = listTimezoneOptions();

        expect(options).toHaveLength(8);
        expect(options[0]).toEqual({ value: 'UTC', label: 'UTC (Coordinated Universal Time)' });
        expect(timezoneLabel('America/New_York')).toBe('Eastern Time (EST/EDT)');
        expect(timezoneLabel('Asia/Tokyo')).toBe('Japan (JST)');
    });

    it('falls back to the raw IANA id for unknown values', () => {
        expect(timezoneLabel('America/Denver')).toBe('America/Denver');
        expect(isEssentialTimezone('America/Denver')).toBe(false);
        expect(isEssentialTimezone('Europe/London')).toBe(true);
    });

    it('detects a browser timezone when available', () => {
        const zone = detectBrowserTimezone();

        expect(zone === null || typeof zone === 'string').toBe(true);
    });

    it('defaults to an essential zone (browser, app, or UTC)', () => {
        const zone = defaultTimezone('America/Chicago');

        expect(isEssentialTimezone(zone)).toBe(true);
    });

    it('falls back to UTC when app timezone is outside the catalog', () => {
        const browser = detectBrowserTimezone();

        if (browser !== null && isEssentialTimezone(browser)) {
            expect(defaultTimezone('Pacific/Auckland')).toBe(browser);

            return;
        }

        expect(defaultTimezone('Pacific/Auckland')).toBe('UTC');
    });
});
