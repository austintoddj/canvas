import { describe, expect, it } from 'vitest';

import {
    addMonths,
    buildMonthGrid,
    calendarIndexPath,
    dateKeyFromIso,
    formatDateKey,
    formatYearMonth,
    gridDateRange,
    groupPostsByDate,
    parseCalendarScope,
    parseYearMonth,
    postsInMonth,
    weekStartsOnForLocale,
} from '@/lib/calendar/month';
import type { CalendarPost } from '@/types/api';

describe('calendar month helpers', () => {
    const now = new Date(2026, 7, 15, 12, 0, 0); // Aug 15, 2026 local

    it('parses and formats year-month values', () => {
        expect(parseYearMonth('2026-08', now)).toEqual({ year: 2026, month: 7 });
        expect(parseYearMonth('invalid', now)).toEqual({ year: 2026, month: 7 });
        expect(parseYearMonth(null, now)).toEqual({ year: 2026, month: 7 });
        expect(formatYearMonth({ year: 2026, month: 0 })).toBe('2026-01');
        expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
        expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    });

    it('builds a Sunday-start August 2026 grid with range bounds', () => {
        const cells = buildMonthGrid({ year: 2026, month: 7 }, 0, now);

        expect(cells.length % 7).toBe(0);
        expect(cells[0].date).toBe('2026-07-26');
        expect(cells[0].inMonth).toBe(false);

        const firstInMonth = cells.find((cell) => cell.date === '2026-08-01');
        expect(firstInMonth).toMatchObject({ day: 1, inMonth: true, isToday: false });

        const today = cells.find((cell) => cell.date === '2026-08-15');
        expect(today).toMatchObject({ inMonth: true, isToday: true });

        const range = gridDateRange(cells);
        expect(range.from).toBe(cells[0].date);
        expect(range.to).toBe(cells[cells.length - 1].date);
        expect(range.to.startsWith('2026-09')).toBe(true);
    });

    it('builds a Monday-start grid with different leading padding', () => {
        const sunday = buildMonthGrid({ year: 2026, month: 7 }, 0, now);
        const monday = buildMonthGrid({ year: 2026, month: 7 }, 1, now);

        expect(sunday[0].date).toBe('2026-07-26');
        expect(monday[0].date).toBe('2026-07-27');
    });

    it('maps ISO timestamps to local day keys and groups posts', () => {
        const localNoon = new Date(2026, 7, 10, 12, 0, 0).toISOString();
        expect(dateKeyFromIso(localNoon)).toBe(formatDateKey(new Date(localNoon)));
        expect(dateKeyFromIso('not-a-date')).toBeNull();
        expect(dateKeyFromIso(null)).toBeNull();

        const posts: CalendarPost[] = [
            {
                id: '1',
                title: 'A',
                slug: 'a',
                published_at: localNoon,
                featured_image: null,
                status: 'published',
            },
            {
                id: '2',
                title: 'B',
                slug: 'b',
                published_at: new Date(2026, 7, 10, 18, 0, 0).toISOString(),
                featured_image: null,
                status: 'scheduled',
            },
            {
                id: '3',
                title: 'C',
                slug: 'c',
                published_at: new Date(2026, 7, 12, 9, 0, 0).toISOString(),
                featured_image: null,
                status: 'published',
            },
        ];

        const grouped = groupPostsByDate(posts);
        const key = formatDateKey(new Date(2026, 7, 10));

        expect(grouped.get(key)?.map((p) => p.id)).toEqual(['1', '2']);
        expect(postsInMonth(posts, { year: 2026, month: 7 })).toHaveLength(3);
        expect(postsInMonth(posts, { year: 2026, month: 6 })).toHaveLength(0);
    });

    it('parses scope and week-start defaults', () => {
        expect(parseCalendarScope('all')).toBe('all');
        expect(parseCalendarScope('user')).toBe('user');
        expect(parseCalendarScope(null)).toBe('user');
        expect(weekStartsOnForLocale('en')).toBe(0);
        expect(weekStartsOnForLocale('en-US')).toBe(0);
        expect(weekStartsOnForLocale('de')).toBe(1);
        expect(weekStartsOnForLocale('ja')).toBe(1);
    });

    it('builds calendar index paths with optional query params', () => {
        expect(calendarIndexPath()).toBe('/calendar');
        expect(calendarIndexPath({ scope: 'user' })).toBe('/calendar');
        expect(calendarIndexPath({ scope: 'all' })).toBe('/calendar?scope=all');
        expect(calendarIndexPath({ month: { year: 2026, month: 7 } })).toBe('/calendar?month=2026-08');
        expect(calendarIndexPath({ month: '2026-09', scope: 'all', day: '2026-09-15' })).toBe(
            '/calendar?month=2026-09&scope=all&day=2026-09-15'
        );
    });
});
