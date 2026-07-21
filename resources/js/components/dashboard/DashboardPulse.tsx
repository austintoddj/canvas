import { Link } from '@/components/link';
import { Text } from '@/components/text';
import { DASHBOARD_PULSE_LABEL_KEYS, type DashboardPulseItem } from '@/lib/dashboard';
import { useCanvas } from '@/hooks/useCanvas';

type DashboardPulseProps = {
    items: DashboardPulseItem[];
};

export function DashboardPulse({ items }: DashboardPulseProps) {
    const { t } = useCanvas();

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-dashboard-pulse="true">
            {items.map((item) => (
                <Link
                    key={item.key}
                    href={item.href}
                    className="rounded-xl border border-zinc-950/10 p-4 transition hover:bg-zinc-950/[0.02] focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5 dark:hover:bg-white/[0.04]"
                >
                    <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                        {t(DASHBOARD_PULSE_LABEL_KEYS[item.key])}
                    </Text>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                        {item.value.toLocaleString()}
                    </p>
                </Link>
            ))}
        </div>
    );
}
