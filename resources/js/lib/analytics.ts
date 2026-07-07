import type { MonthOverMonth } from '@/types/api';

export type DailyDataPoint = {
    date: string;
    value: number;
    label: string;
};

export function parseDailyGraph(serialized: string): DailyDataPoint[] {
    let parsed: unknown;

    try {
        parsed = JSON.parse(serialized);
    } catch {
        return [];
    }

    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return [];
    }

    return Object.entries(parsed as Record<string, unknown>)
        .map(([date, value]) => ({
            date,
            value: typeof value === 'number' ? value : Number(value) || 0,
            label: formatChartDate(date),
        }))
        .sort((left, right) => left.date.localeCompare(right.date));
}

export function formatChartDate(date: string): string {
    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatMonthOverMonth(change: MonthOverMonth): string {
    const direction = change.direction === 'up' ? 'up' : 'down';

    return `${direction} ${change.percentage}%`;
}

export function rankedEntries(record: Record<string, string | number>, limit = 10): [string, string][] {
    return Object.entries(record)
        .sort(([, left], [, right]) => Number(right) - Number(left))
        .slice(0, limit)
        .map(([label, value]) => [label, String(value)]);
}