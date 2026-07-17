/**
 * Compact relative time for “Enabled 2 months ago” style meta (GitHub-like).
 * Uses Intl.RelativeTimeFormat; no external date library.
 */
export function formatRelativeTime(
    value: string | null | undefined,
    now: Date = new Date(),
    locales?: string | string[]
): string | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const diffMs = date.getTime() - now.getTime();
    const absSeconds = Math.round(Math.abs(diffMs) / 1000);

    let unit: Intl.RelativeTimeFormatUnit;
    let amount: number;

    if (absSeconds < 45) {
        unit = 'second';
        amount = Math.round(diffMs / 1000);
    } else if (absSeconds < 45 * 60) {
        unit = 'minute';
        amount = Math.round(diffMs / (60 * 1000));
    } else if (absSeconds < 22 * 60 * 60) {
        unit = 'hour';
        amount = Math.round(diffMs / (60 * 60 * 1000));
    } else if (absSeconds < 26 * 24 * 60 * 60) {
        unit = 'day';
        amount = Math.round(diffMs / (24 * 60 * 60 * 1000));
    } else if (absSeconds < 320 * 24 * 60 * 60) {
        unit = 'month';
        amount = Math.round(diffMs / (30 * 24 * 60 * 60 * 1000));
    } else {
        unit = 'year';
        amount = Math.round(diffMs / (365 * 24 * 60 * 60 * 1000));
    }

    if (amount === 0) {
        unit = 'second';
        amount = 0;
    }

    try {
        return new Intl.RelativeTimeFormat(locales, { numeric: 'auto' }).format(amount, unit);
    } catch {
        return null;
    }
}
