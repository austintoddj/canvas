import { describe, expect, it } from 'vitest';

import {
    formatMonthOverMonth,
    formatShareLabel,
    parseDailyGraph,
    rankedEntries,
    rankedToCsv,
    rankedWithShare,
    seriesGeometry,
    seriesToAreaPath,
    seriesToLinePath,
} from '@/lib/analytics';
import { hostFromLabel, logoUrlForHost, resolveAnalyticsMark } from '@/lib/analytics-icons';

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

    it('ranks entries with share of total', () => {
        const ranked = rankedWithShare({ Twitter: 4, Direct: 10, Google: 6 });

        expect(ranked).toEqual([
            {
                label: 'Direct',
                value: 10,
                displayValue: '10',
                share: 0.5,
                shareLabel: '50%',
            },
            {
                label: 'Google',
                value: 6,
                displayValue: '6',
                share: 0.3,
                shareLabel: '30%',
            },
            {
                label: 'Twitter',
                value: 4,
                displayValue: '4',
                share: 0.2,
                shareLabel: '20%',
            },
        ]);

        expect(rankedWithShare({})).toEqual([]);
        expect(rankedWithShare({ A: 0, B: 0 })).toEqual([
            { label: 'A', value: 0, displayValue: '0', share: 0, shareLabel: '0%' },
            { label: 'B', value: 0, displayValue: '0', share: 0, shareLabel: '0%' },
        ]);

        const limited = rankedWithShare({ A: 90, B: 5, C: 5 }, 1);
        expect(limited).toHaveLength(1);
        expect(limited[0]?.share).toBeCloseTo(0.9);
        expect(limited[0]?.shareLabel).toBe('90%');

        expect(formatShareLabel(0.004)).toBe('<0.5%');
        expect(formatShareLabel(0.5)).toBe('50%');
        expect(rankedWithShare({ A: 1, B: 2 }, 0)).toHaveLength(2);
    });

    it('serializes ranked rows to csv', () => {
        const csv = rankedToCsv([
            { label: 'google.com', value: 10, displayValue: '10', share: 0.5, shareLabel: '50%' },
            { label: 'Has, comma', value: 5, displayValue: '5', share: 0.25, shareLabel: '25%' },
        ]);

        expect(csv).toContain('Name,Value,Share');
        expect(csv).toContain('google.com,10,50%');
        expect(csv).toContain('"Has, comma",5,25%');
    });

    it('resolves real logo URLs for browsers and referrer hosts', () => {
        const chrome = resolveAnalyticsMark('browser', 'Chrome');
        expect(chrome.type).toBe('logo');
        if (chrome.type === 'logo') {
            expect(chrome.src).toContain('browser-logos');
            expect(chrome.src).toContain('chrome');
        }

        const google = resolveAnalyticsMark('referer', 'https://www.google.com/search');
        expect(google.type).toBe('logo');
        if (google.type === 'logo') {
            expect(google.src).toContain('favicons');
            expect(google.src).toContain('google.com');
        }

        expect(hostFromLabel('https://news.ycombinator.com/item?id=1')).toBe('news.ycombinator.com');
        expect(logoUrlForHost('facebook.com')).toContain('facebook.com');
        expect(resolveAnalyticsMark('referer', 'Direct')).toEqual({ type: 'fallback', fallback: 'link' });
        expect(resolveAnalyticsMark('time', '9:00 AM - 10:00 AM')).toEqual({
            type: 'fallback',
            fallback: 'clock',
        });
    });

    it('treats precomputed percentage records as shares', () => {
        const ranked = rankedWithShare({ '9:00 AM - 10:00 AM': '40.5', '2:00 PM - 3:00 PM': '20' }, 10, {
            valuesAreShares: true,
        });

        expect(ranked[0]?.label).toBe('9:00 AM - 10:00 AM');
        expect(ranked[0]?.share).toBeCloseTo(0.405);
        expect(ranked[0]?.displayValue).toMatch(/40\.5%/);
        expect(ranked[0]?.shareLabel).toBeUndefined();
        expect(ranked[1]?.share).toBeCloseTo(0.2);
    });

    it('builds line and area paths for series geometry', () => {
        const empty = seriesGeometry([]);
        expect(empty.linePath).toBe('');
        expect(empty.areaPath).toBe('');
        expect(seriesToLinePath([])).toBe('');
        expect(seriesToAreaPath([])).toBe('');

        const single = seriesGeometry([{ date: '2026-06-01', value: 5, label: 'Jun 1' }], 100, 100);
        expect(single.points).toHaveLength(1);
        expect(single.maxValue).toBe(5);
        expect(single.linePath).toMatch(/^M /);
        expect(single.areaPath).toMatch(/ Z$/);

        const flat = seriesGeometry(
            [
                { date: '2026-06-01', value: 0, label: 'Jun 1' },
                { date: '2026-06-02', value: 0, label: 'Jun 2' },
            ],
            100,
            100
        );
        expect(flat.maxValue).toBe(0);
        expect(flat.points.every((point) => point.y === 96)).toBe(true);

        const series = [
            { date: '2026-06-01', value: 0, label: 'Jun 1' },
            { date: '2026-06-02', value: 10, label: 'Jun 2' },
            { date: '2026-06-03', value: 5, label: 'Jun 3' },
        ];
        const geometry = seriesGeometry(series, 100, 100);
        expect(geometry.points).toHaveLength(3);
        expect(geometry.points[0]?.y).toBeGreaterThan(geometry.points[1]?.y ?? 0);
        expect(seriesToLinePath(series)).toBe(geometry.linePath);
        expect(seriesToAreaPath(series)).toBe(geometry.areaPath);
    });
});
