import { describe, expect, it } from 'vitest';

import {
    buildMonthGrid,
    clampScheduleDate,
    combineDateAndTime,
    defaultScheduleDate,
    formatScheduleSummary,
    fromTwelveHourParts,
    isScheduleInFuture,
    isSameDay,
    minuteOptions,
    parseDatetimeLocalValue,
    roundUpToMinuteStep,
    schedulePresets,
    toPickerValue,
    toTwelveHourParts,
    weekdayLabels,
} from '@/lib/datetime-picker';
import { fromDatetimeLocalValue } from '@/lib/posts/form';

describe('datetime-picker', () => {
    it('rounds up to the next minute step', () => {
        const base = new Date(2026, 5, 15, 14, 1, 0);
        expect(roundUpToMinuteStep(base, 15).getMinutes()).toBe(15);
        expect(roundUpToMinuteStep(new Date(2026, 5, 15, 14, 0, 0), 15).getMinutes()).toBe(0);
        expect(roundUpToMinuteStep(new Date(2026, 5, 15, 14, 0, 1), 15).getMinutes()).toBe(15);
    });

    it('defaults schedule to about one hour ahead on a clean step', () => {
        const now = new Date(2026, 5, 15, 14, 7, 30);
        const next = defaultScheduleDate(now, 15);

        expect(next.getTime()).toBeGreaterThan(now.getTime());
        expect(next.getHours()).toBe(15);
        expect(next.getMinutes()).toBe(15);
    });

    it('clamps past instants into the future', () => {
        const now = new Date(2026, 5, 15, 14, 30, 0);
        const past = new Date(2026, 5, 15, 10, 0, 0);
        const clamped = clampScheduleDate(past, now, 15);

        expect(clamped.getTime()).toBeGreaterThan(now.getTime());
        expect(isSameDay(clamped, now)).toBe(true);
    });

    it('builds a 6×7 month grid with disabled past days', () => {
        const now = new Date(2026, 5, 15, 12, 0, 0);
        const cells = buildMonthGrid({ year: 2026, month: 5 }, { now, weekStartsOn: 0 });

        expect(cells).toHaveLength(42);
        expect(cells.some((cell) => cell.inMonth && cell.day === 1)).toBe(true);
        expect(cells.find((cell) => cell.inMonth && cell.day === 15)?.isToday).toBe(true);

        const past = cells.find((cell) => cell.inMonth && cell.day === 10);
        expect(past?.disabled).toBe(true);

        const future = cells.find((cell) => cell.inMonth && cell.day === 20);
        expect(future?.disabled).toBe(false);
    });

    it('formats a readable summary and parses datetime-local values', () => {
        const value = '2099-06-15T14:45';
        const parsed = parseDatetimeLocalValue(value);

        expect(parsed).not.toBeNull();
        expect(toPickerValue(parsed!)).toBe(value);
        expect(fromDatetimeLocalValue(value)).toBe('2099-06-15 14:45:00');
        expect(isScheduleInFuture(value, new Date(2026, 0, 1))).toBe(true);
        expect(isScheduleInFuture('2020-01-01T00:00', new Date(2026, 0, 1))).toBe(false);

        const summary = formatScheduleSummary(value, 'en-US');
        expect(summary).toMatch(/Jun/);
        expect(summary).toMatch(/15/);
        expect(summary).toMatch(/2099/);
    });

    it('exposes schedule presets in the future', () => {
        const now = new Date(2026, 5, 15, 14, 0, 0); // Monday
        const presets = schedulePresets(now, 15);

        expect(presets.map((preset) => preset.id)).toEqual(['in_one_hour', 'tomorrow_morning', 'next_monday']);
        for (const preset of presets) {
            expect(preset.date.getTime()).toBeGreaterThan(now.getTime());
        }

        const monday = presets.find((preset) => preset.id === 'next_monday')!;
        expect(monday.date.getDay()).toBe(1);
        expect(monday.date.getHours()).toBe(9);
    });

    it('combines date and time and supports 12-hour parts', () => {
        const day = new Date(2026, 5, 20);
        const combined = combineDateAndTime(day, 14, 30);

        expect(combined.getFullYear()).toBe(2026);
        expect(combined.getMonth()).toBe(5);
        expect(combined.getDate()).toBe(20);
        expect(combined.getHours()).toBe(14);
        expect(combined.getMinutes()).toBe(30);

        expect(toTwelveHourParts(0)).toEqual({ hour12: 12, meridiem: 'am' });
        expect(toTwelveHourParts(14)).toEqual({ hour12: 2, meridiem: 'pm' });
        expect(fromTwelveHourParts(12, 'am')).toBe(0);
        expect(fromTwelveHourParts(2, 'pm')).toBe(14);
        expect(minuteOptions(15)).toEqual([0, 15, 30, 45]);
    });

    it('returns seven weekday labels', () => {
        expect(weekdayLabels('en-US', 0)).toHaveLength(7);
        expect(weekdayLabels('en-US', 1)).toHaveLength(7);
    });
});
