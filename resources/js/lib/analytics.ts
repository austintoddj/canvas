import type { MonthOverMonth } from '@/types/api';

export type DailyDataPoint = {
    date: string;
    value: number;
    label: string;
};

export type ChartPoint = {
    x: number;
    y: number;
    date: string;
    label: string;
    value: number;
};

export type RankedShareEntry = {
    label: string;
    value: number;
    displayValue: string;
    /** Share of total, 0–1, drives the row bar width. */
    share: number;
    /** Optional secondary share label (e.g. "40%"); omit when displayValue is already a share. */
    shareLabel?: string;
};

export type SeriesGeometry = {
    points: ChartPoint[];
    linePath: string;
    areaPath: string;
    maxValue: number;
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

export type MonthOverMonthPresentation =
    { kind: 'percent'; direction: 'up' | 'down'; percentage: string } | { kind: 'new' } | { kind: 'none' };

export function presentMonthOverMonth(
    change: MonthOverMonth | undefined,
    currentValue = 0
): MonthOverMonthPresentation {
    if (!change) {
        return { kind: 'none' };
    }

    if (!change.comparable) {
        return currentValue > 0 ? { kind: 'new' } : { kind: 'none' };
    }

    return {
        kind: 'percent',
        direction: change.direction,
        percentage: change.percentage,
    };
}

export function formatMonthOverMonth(change: MonthOverMonth): string {
    if (!change.comparable) {
        return 'new';
    }

    const direction = change.direction === 'up' ? 'up' : 'down';

    return `${direction} ${change.percentage}%`;
}

export function rankedEntries(record: Record<string, string | number>, limit = 10): [string, string][] {
    return Object.entries(record)
        .sort(([, left], [, right]) => Number(right) - Number(left))
        .slice(0, limit)
        .map(([label, value]) => [label, String(value)]);
}

/**
 * Rank entries by numeric value and attach share of total (0–1).
 * When `valuesAreShares` is true, values are already percentages (e.g. popular times).
 * Share is computed against the full record, then the list is limited for display.
 */
export function rankedWithShare(
    record: Record<string, string | number>,
    limit = 10,
    options: { valuesAreShares?: boolean } = {}
): RankedShareEntry[] {
    const entries = Object.entries(record)
        .map(([label, raw]) => {
            const value = typeof raw === 'number' ? raw : Number(raw) || 0;

            return { label, value, displayValue: String(raw) };
        })
        .sort((left, right) => right.value - left.value);

    if (entries.length === 0) {
        return [];
    }

    const ranked: RankedShareEntry[] = options.valuesAreShares
        ? entries.map((entry) => {
              const share = Math.min(Math.max(entry.value / 100, 0), 1);

              return {
                  ...entry,
                  share,
                  displayValue: `${Number(entry.displayValue).toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                  })}%`,
              };
          })
        : (() => {
              const total = entries.reduce((sum, entry) => sum + entry.value, 0);

              return entries.map((entry) => {
                  const share = total > 0 ? entry.value / total : 0;

                  return {
                      ...entry,
                      share,
                      displayValue: entry.value.toLocaleString(),
                      shareLabel: formatShareLabel(share),
                  };
              });
          })();

    return limit > 0 ? ranked.slice(0, limit) : ranked;
}

export function formatShareLabel(share: number): string {
    const percent = share * 100;

    if (percent > 0 && percent < 0.5) {
        return '<0.5%';
    }

    return `${Math.round(percent)}%`;
}

export function rankedToCsv(
    entries: RankedShareEntry[],
    columns: { label: string; value: string; share?: string } = {
        label: 'Name',
        value: 'Value',
        share: 'Share',
    }
): string {
    const header = [columns.label, columns.value, columns.share].filter(Boolean) as string[];
    const rows = entries.map((entry) => {
        const cells = [entry.label, entry.displayValue];

        if (columns.share) {
            cells.push(entry.shareLabel ?? `${Math.round(entry.share * 100)}%`);
        }

        return cells.map(escapeCsvCell).join(',');
    });

    return [header.map(escapeCsvCell).join(','), ...rows].join('\n');
}

export function downloadCsv(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string): string {
    if (/[",\n\r]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
}

export function seriesGeometry(
    data: DailyDataPoint[],
    width = 100,
    height = 100,
    padding = { top: 4, right: 0, bottom: 4, left: 0 }
): SeriesGeometry {
    if (data.length === 0) {
        return { points: [], linePath: '', areaPath: '', maxValue: 0 };
    }

    const maxValue = Math.max(...data.map((point) => point.value), 0);
    const plotWidth = Math.max(width - padding.left - padding.right, 1);
    const plotHeight = Math.max(height - padding.top - padding.bottom, 1);
    const denominator = Math.max(data.length - 1, 1);
    const yScale = maxValue > 0 ? plotHeight / maxValue : 0;

    const points: ChartPoint[] = data.map((point, index) => {
        const x = padding.left + (index / denominator) * plotWidth;
        const y = maxValue === 0 ? padding.top + plotHeight : padding.top + plotHeight - point.value * yScale;

        return {
            x,
            y,
            date: point.date,
            label: point.label,
            value: point.value,
        };
    });

    const linePath = pointsToLinePath(points);
    const baseline = padding.top + plotHeight;
    const areaPath =
        points.length === 0
            ? ''
            : `${linePath} L ${points[points.length - 1]!.x} ${baseline} L ${points[0]!.x} ${baseline} Z`;

    return { points, linePath, areaPath, maxValue };
}

export function seriesToLinePath(data: DailyDataPoint[], width = 100, height = 100): string {
    return seriesGeometry(data, width, height).linePath;
}

export function seriesToAreaPath(data: DailyDataPoint[], width = 100, height = 100): string {
    return seriesGeometry(data, width, height).areaPath;
}

function pointsToLinePath(points: ChartPoint[]): string {
    if (points.length === 0) {
        return '';
    }

    return points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ');
}
