import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

import { Text } from '@/components/text';
import type { MonthOverMonth } from '@/types/api';

type StatCardProps = {
    label: string;
    value: number;
    change?: MonthOverMonth;
};

export default function StatCard({ label, value, change }: StatCardProps) {
    const isUp = change?.direction === 'up';

    return (
        <div className="rounded-xl border border-zinc-950/10 p-5 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">{label}</Text>
            <p className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">{value.toLocaleString()}</p>
            {change ? (
                <p
                    className={clsx(
                        'mt-2 flex items-center gap-1 text-sm font-medium',
                        isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}
                >
                    {isUp ? <ArrowUpIcon className="size-4" /> : <ArrowDownIcon className="size-4" />}
                    {change.percentage}% vs last month
                </p>
            ) : null}
        </div>
    );
}
