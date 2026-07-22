import clsx from 'clsx';
import type { ReactNode } from 'react';

import Sparkline from '@/components/analytics/Sparkline';
import { Text } from '@/components/text';
import { presentMonthOverMonth, type DailyDataPoint } from '@/lib/analytics';
import type { MonthOverMonth } from '@/types/api';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

type StatCardProps = {
    label: string;
    value?: number;
    /** When set, renders this instead of a numeric value (e.g. reading time). */
    valueLabel?: string;
    change?: MonthOverMonth;
    changeSuffix?: string;
    newLabel?: string;
    sparkline?: DailyDataPoint[];
    footer?: ReactNode;
};

export default function StatCard({
    label,
    value,
    valueLabel,
    change,
    changeSuffix = 'vs last month',
    newLabel = 'New this period',
    sparkline,
    footer,
}: StatCardProps) {
    const display = valueLabel ?? (typeof value === 'number' ? value.toLocaleString() : '—');
    const presentation = presentMonthOverMonth(change, typeof value === 'number' ? value : 0);

    return (
        <div className="rounded-xl border border-zinc-950/10 p-5 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5">
            <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">{label}</Text>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-zinc-950 dark:text-white">
                {display}
            </p>
            {presentation.kind === 'percent' ? (
                <p
                    className={clsx(
                        'mt-2 flex items-center gap-1 text-sm font-medium',
                        presentation.direction === 'up'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                    )}
                >
                    {presentation.direction === 'up' ? (
                        <IconArrowUp className="size-4" />
                    ) : (
                        <IconArrowDown className="size-4" />
                    )}
                    {presentation.percentage}% {changeSuffix}
                </p>
            ) : null}
            {presentation.kind === 'new' ? (
                <p className="mt-2 text-sm font-medium text-blue-700 dark:text-blue-300">{newLabel}</p>
            ) : null}
            {sparkline ? (
                <div className="mt-3 text-blue-500 dark:text-blue-400">
                    <Sparkline data={sparkline} className="h-7 w-full" />
                </div>
            ) : null}
            {footer ? <div className="mt-3">{footer}</div> : null}
        </div>
    );
}
