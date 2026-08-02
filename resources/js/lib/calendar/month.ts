import type { CalendarPost } from '@/types/api';

export type CalendarScope = 'user' | 'all';

export type YearMonth = {
    year: number;
    /** 0-indexed month (Date convention). */
    month: number;
};

export type CalendarDayCell = {
    /** Local calendar day as Y-m-d. */
    date: string;
    day: number;
    inMonth: boolean;
    isToday: boolean;
};

/** Format a local Date as Y-m-d. */
export function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/** Parse YYYY-MM from the URL; falls back to the current local month. */
export function parseYearMonth(value: string | null | undefined, now: Date = new Date()): YearMonth {
    if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) {
        const year = Number.parseInt(value.slice(0, 4), 10);
        const month = Number.parseInt(value.slice(5, 7), 10) - 1;

        if (year >= 1970 && year <= 2100 && month >= 0 && month <= 11) {
            return { year, month };
        }
    }

    return { year: now.getFullYear(), month: now.getMonth() };
}

export function formatYearMonth({ year, month }: YearMonth): string {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
    const date = new Date(year, month + delta, 1);

    return { year: date.getFullYear(), month: date.getMonth() };
}

export function parseCalendarScope(value: string | null | undefined): CalendarScope {
    return value === 'all' ? 'all' : 'user';
}

/**
 * Build a 6×7 (or shorter trailing) month grid of local calendar days.
 * `weekStartsOn`: 0 = Sunday, 1 = Monday.
 */
export function buildMonthGrid(
    { year, month }: YearMonth,
    weekStartsOn: 0 | 1 = 0,
    now: Date = new Date()
): CalendarDayCell[] {
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = firstOfMonth.getDay(); // 0 Sun … 6 Sat
    const leading = (firstWeekday - weekStartsOn + 7) % 7;
    const todayKey = formatDateKey(now);

    const cells: CalendarDayCell[] = [];

    // Leading days from previous month
    for (let i = 0; i < leading; i++) {
        const date = new Date(year, month, 1 - (leading - i));
        const key = formatDateKey(date);
        cells.push({
            date: key,
            day: date.getDate(),
            inMonth: false,
            isToday: key === todayKey,
        });
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const key = formatDateKey(date);
        cells.push({
            date: key,
            day,
            inMonth: true,
            isToday: key === todayKey,
        });
    }

    // Trailing days so the grid ends on a full week
    while (cells.length % 7 !== 0) {
        const last = cells[cells.length - 1];
        const [y, m, d] = last.date.split('-').map(Number);
        const date = new Date(y, m - 1, d + 1);
        const key = formatDateKey(date);
        cells.push({
            date: key,
            day: date.getDate(),
            inMonth: false,
            isToday: key === todayKey,
        });
    }

    return cells;
}

export function gridDateRange(cells: CalendarDayCell[]): { from: string; to: string } {
    if (cells.length === 0) {
        const today = formatDateKey(new Date());

        return { from: today, to: today };
    }

    return {
        from: cells[0].date,
        to: cells[cells.length - 1].date,
    };
}

/** Map ISO published_at to a local Y-m-d day key. */
export function dateKeyFromIso(iso: string | null | undefined): string | null {
    if (iso === null || iso === undefined || iso === '') {
        return null;
    }

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return formatDateKey(date);
}

export function groupPostsByDate(posts: CalendarPost[]): Map<string, CalendarPost[]> {
    const map = new Map<string, CalendarPost[]>();

    for (const post of posts) {
        const key = dateKeyFromIso(post.published_at);

        if (key === null) {
            continue;
        }

        const bucket = map.get(key);

        if (bucket) {
            bucket.push(post);
        } else {
            map.set(key, [post]);
        }
    }

    return map;
}

/** Short weekday labels for the header row, starting at weekStartsOn. */
export function weekdayLabels(locale: string | undefined, weekStartsOn: 0 | 1 = 0): string[] {
    const formatter = new Intl.DateTimeFormat(locale || undefined, { weekday: 'short' });
    // 2024-01-07 is a Sunday
    const sunday = new Date(2024, 0, 7);
    const labels: string[] = [];

    for (let i = 0; i < 7; i++) {
        const day = new Date(sunday);
        day.setDate(sunday.getDate() + ((weekStartsOn + i) % 7));
        labels.push(formatter.format(day));
    }

    return labels;
}

export function formatMonthTitle({ year, month }: YearMonth, locale: string | undefined): string {
    return new Intl.DateTimeFormat(locale || undefined, {
        month: 'long',
        year: 'numeric',
    }).format(new Date(year, month, 1));
}

/** Prefer Monday start for common non-US locales; Sunday otherwise. */
export function weekStartsOnForLocale(locale: string | undefined): 0 | 1 {
    if (!locale) {
        return 0;
    }

    const base = locale.toLowerCase().split('-')[0];

    // US-centric Sunday start; most other catalog locales use Monday.
    if (base === 'en') {
        return 0;
    }

    return 1;
}

export function postsInMonth(posts: CalendarPost[], { year, month }: YearMonth): CalendarPost[] {
    const prefix = formatYearMonth({ year, month });

    return posts.filter((post) => {
        const key = dateKeyFromIso(post.published_at);

        return key !== null && key.startsWith(prefix);
    });
}

/** Build `/calendar` with optional month, scope, and selected day query params. */
export function calendarIndexPath(
    options: {
        month?: YearMonth | string | null;
        scope?: CalendarScope;
        day?: string | null;
    } = {}
): string {
    const params = new URLSearchParams();

    if (options.month != null && options.month !== '') {
        const monthKey = typeof options.month === 'string' ? options.month : formatYearMonth(options.month);

        if (/^\d{4}-\d{2}$/.test(monthKey)) {
            params.set('month', monthKey);
        }
    }

    if (options.scope === 'all') {
        params.set('scope', 'all');
    }

    if (options.day != null && options.day !== '' && /^\d{4}-\d{2}-\d{2}$/.test(options.day)) {
        params.set('day', options.day);
    }

    const query = params.toString();

    return query === '' ? '/calendar' : `/calendar?${query}`;
}
