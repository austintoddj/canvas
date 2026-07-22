import { formatRelativeTime } from '@/lib/format-relative-time';
import { parsePublishedAt } from '@/lib/posts/form';

export type PublishTimingMode = 'now' | 'later';

export function parseDatetimeLocalAsDate(value: string): Date | null {
    const trimmed = value.trim();

    if (trimmed === '') {
        return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed);

    if (match === null) {
        return parsePublishedAt(trimmed);
    }

    const date = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        0,
        0
    );

    return Number.isNaN(date.getTime()) ? null : date;
}

export function publishTimingSummary(
    mode: PublishTimingMode,
    scheduleAt: string,
    locale: string,
    labels: { now: string; laterFallback: string },
    now: Date = new Date()
): string {
    if (mode === 'now') {
        return labels.now;
    }

    const parsed = parseDatetimeLocalAsDate(scheduleAt);

    if (parsed === null) {
        return labels.laterFallback;
    }

    const relative = formatRelativeTime(parsed.toISOString(), now, locale);

    if (relative !== null && relative.trim() !== '') {
        return relative;
    }

    return parsed.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}
