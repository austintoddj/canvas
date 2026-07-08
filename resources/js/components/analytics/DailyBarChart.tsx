import { Subheading } from '@/components/heading';
import { Text } from '@/components/text';
import type { DailyDataPoint } from '@/lib/analytics';

type DailyBarChartProps = {
    title: string;
    data: DailyDataPoint[];
};

export default function DailyBarChart({ title, data }: DailyBarChartProps) {
    const maxValue = Math.max(...data.map((point) => point.value), 1);
    const total = data.reduce((sum, point) => sum + point.value, 0);

    if (data.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-950/10 p-5 dark:border-white/10">
                <Subheading level={3} className="text-sm/6">
                    {title}
                </Subheading>
                <Text className="mt-4 text-sm text-zinc-500">No data for this period.</Text>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-950/10 p-5 dark:border-white/10">
            <div className="flex items-baseline justify-between gap-3">
                <Subheading level={3} className="text-sm/6">
                    {title}
                </Subheading>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">{total.toLocaleString()} total</Text>
            </div>

            <div
                className="mt-6 flex h-44 items-end gap-0.5"
                role="img"
                aria-label={`${title}: ${total.toLocaleString()} over the last ${data.length} days`}
            >
                {data.map((point) => (
                    <div
                        key={point.date}
                        title={`${point.label}: ${point.value.toLocaleString()}`}
                        className="flex-1 rounded-t bg-blue-500/80 transition-colors hover:bg-blue-600 dark:bg-blue-400/70 dark:hover:bg-blue-300/80"
                        style={{
                            height: `${(point.value / maxValue) * 100}%`,
                            minHeight: point.value > 0 ? '2px' : '0',
                        }}
                    />
                ))}
            </div>

            <div className="mt-3 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{data[0]?.label}</span>
                <span>{data[data.length - 1]?.label}</span>
            </div>
        </div>
    );
}
