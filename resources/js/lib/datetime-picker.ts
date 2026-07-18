import { parsePublishedAt, toDatetimeLocalValue } from '@/lib/posts/form';

export const MINUTE_STEP = 15;

export type MonthCell = {
    date: Date;
    day: number;
    inMonth: boolean;
    isToday: boolean;
    disabled: boolean;
};

export type SchedulePresetId = 'in_one_hour' | 'tomorrow_morning' | 'next_monday';

export type SchedulePreset = {
    id: SchedulePresetId;
    date: Date;
};

export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function roundUpToMinuteStep(date: Date, step: number = MINUTE_STEP): Date {
    const next = new Date(date.getTime());
    next.setSeconds(0, 0);

    const minutes = next.getMinutes();
    const remainder = minutes % step;

    if (remainder === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0) {
        return next;
    }

    const add = remainder === 0 ? step : step - remainder;
    next.setMinutes(minutes + add);

    return next;
}

/** Next clean schedule slot: at least one hour ahead, aligned to minute step. */
export function defaultScheduleDate(now: Date = new Date(), step: number = MINUTE_STEP): Date {
    const candidate = new Date(now.getTime());
    candidate.setHours(candidate.getHours() + 1);

    return roundUpToMinuteStep(candidate, step);
}

/** Ensure a schedule instant is strictly in the future; otherwise use the default slot. */
export function clampScheduleDate(date: Date, now: Date = new Date(), step: number = MINUTE_STEP): Date {
    if (date.getTime() > now.getTime()) {
        return new Date(date.getTime());
    }

    const roundedFromNow = roundUpToMinuteStep(new Date(now.getTime() + 60_000), step);

    if (roundedFromNow.getTime() > now.getTime() && isSameDay(date, now)) {
        return roundedFromNow;
    }

    return defaultScheduleDate(now, step);
}

export function isScheduleInFuture(value: string, now: Date = new Date()): boolean {
    const parsed = parseDatetimeLocalValue(value);

    if (parsed === null) {
        return false;
    }

    return parsed.getTime() > now.getTime();
}

export function parseDatetimeLocalValue(value: string): Date | null {
    const trimmed = value.trim();

    if (trimmed === '') {
        return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);

    if (match === null) {
        return parsePublishedAt(trimmed);
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hours = Number(match[4]);
    const minutes = Number(match[5]);
    const seconds = match[6] !== undefined ? Number(match[6]) : 0;
    const local = new Date(year, month - 1, day, hours, minutes, seconds);

    if (
        local.getFullYear() !== year ||
        local.getMonth() !== month - 1 ||
        local.getDate() !== day ||
        local.getHours() !== hours ||
        local.getMinutes() !== minutes
    ) {
        return null;
    }

    return local;
}

export function buildMonthGrid(
    view: { year: number; month: number },
    options: { now?: Date; weekStartsOn?: 0 | 1; minDate?: Date } = {}
): MonthCell[] {
    const now = options.now ?? new Date();
    const weekStartsOn = options.weekStartsOn ?? 0;
    const minDay = startOfDay(options.minDate ?? now);

    const firstOfMonth = new Date(view.year, view.month, 1);
    const firstWeekday = firstOfMonth.getDay();
    const leading = (firstWeekday - weekStartsOn + 7) % 7;
    const gridStart = new Date(view.year, view.month, 1 - leading);

    const cells: MonthCell[] = [];

    for (let index = 0; index < 42; index++) {
        const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
        const dayStart = startOfDay(date);

        cells.push({
            date,
            day: date.getDate(),
            inMonth: date.getMonth() === view.month,
            isToday: isSameDay(date, now),
            disabled: dayStart.getTime() < minDay.getTime(),
        });
    }

    return cells;
}

export function weekdayLabels(locale?: string, weekStartsOn: 0 | 1 = 0): string[] {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // 2024-01-07 is Sunday
    const sunday = new Date(2024, 0, 7);
    const labels: string[] = [];

    for (let offset = 0; offset < 7; offset++) {
        const day = new Date(sunday);
        day.setDate(sunday.getDate() + ((weekStartsOn + offset) % 7));
        labels.push(formatter.format(day));
    }

    return labels;
}

export function monthYearLabel(view: { year: number; month: number }, locale?: string): string {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
        new Date(view.year, view.month, 1)
    );
}

export function formatScheduleSummary(value: string | Date | null | undefined, locale?: string): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const date = typeof value === 'string' ? (parseDatetimeLocalValue(value) ?? parsePublishedAt(value)) : value;

    if (date === null || Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

export function schedulePresets(now: Date = new Date(), step: number = MINUTE_STEP): SchedulePreset[] {
    const inOneHour = defaultScheduleDate(now, step);

    const tomorrowMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0);

    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday, 9, 0, 0, 0);

    return [
        { id: 'in_one_hour', date: inOneHour },
        { id: 'tomorrow_morning', date: tomorrowMorning },
        { id: 'next_monday', date: nextMonday },
    ];
}

export function combineDateAndTime(day: Date, hours: number, minutes: number): Date {
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes, 0, 0);
}

export function toPickerValue(date: Date): string {
    return toDatetimeLocalValue(date);
}

export function minuteOptions(step: number = MINUTE_STEP): number[] {
    const options: number[] = [];

    for (let minute = 0; minute < 60; minute += step) {
        options.push(minute);
    }

    return options;
}

export function usesTwelveHourClock(locale?: string): boolean {
    const sample = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).formatToParts(new Date(2024, 0, 1, 13));

    return sample.some((part) => part.type === 'dayPeriod');
}

export function toTwelveHourParts(hours24: number): { hour12: number; meridiem: 'am' | 'pm' } {
    const meridiem = hours24 >= 12 ? 'pm' : 'am';
    const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    return { hour12, meridiem };
}

export function fromTwelveHourParts(hour12: number, meridiem: 'am' | 'pm'): number {
    if (meridiem === 'am') {
        return hour12 === 12 ? 0 : hour12;
    }

    return hour12 === 12 ? 12 : hour12 + 12;
}
