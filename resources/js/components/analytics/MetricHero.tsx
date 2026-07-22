import clsx from 'clsx';

import AreaChart from '@/components/analytics/AreaChart';
import { Text } from '@/components/text';
import { presentMonthOverMonth, type DailyDataPoint } from '@/lib/analytics';
import type { MonthOverMonth } from '@/types/api';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

type MetricHeroProps = {
    label: string;
    value: number;
    change?: MonthOverMonth;
    changeSuffix?: string;
    newLabel?: string;
    series: DailyDataPoint[];
    caption?: string;
    emptyLabel?: string;
    className?: string;
};

export default function MetricHero({
    label,
    value,
    change,
    changeSuffix = 'vs last month',
    newLabel = 'New this period',
    series,
    caption,
    emptyLabel,
    className,
}: MetricHeroProps) {
    const presentation = presentMonthOverMonth(change, value);

    return (
        <div
            className={clsx(
                'flex h-full flex-col rounded-xl border border-zinc-950/10 p-5 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5 sm:p-6',
                className
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">{label}</Text>
                    <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-zinc-950 sm:text-5xl dark:text-white">
                        {value.toLocaleString()}
                    </p>
                </div>
                {presentation.kind === 'percent' ? (
                    <p
                        className={clsx(
                            'mt-1 flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium',
                            presentation.direction === 'up'
                                ? 'bg-green-500/10 text-green-700 dark:bg-green-400/10 dark:text-green-400'
                                : 'bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-400'
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
                    <p className="mt-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-sm font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                        {newLabel}
                    </p>
                ) : null}
            </div>

            <AreaChart
                data={series}
                caption={caption}
                emptyLabel={emptyLabel}
                className="mt-2 min-h-0 flex-1 border-0 p-0 dark:bg-transparent dark:ring-0"
            />
        </div>
    );
}
