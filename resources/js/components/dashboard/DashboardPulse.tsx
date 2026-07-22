import clsx from 'clsx';
import {
    IconCalendarEvent,
    IconFileCheck,
    IconPencil,
    IconRefresh,
    type Icon as TablerIcon,
} from '@tabler/icons-react';

import { Link } from '@/components/link';
import { Text } from '@/components/text';
import { DASHBOARD_PULSE_LABEL_KEYS, type DashboardPulseItem } from '@/lib/dashboard';
import { useCanvas } from '@/hooks/useCanvas';

type DashboardPulseProps = {
    items: DashboardPulseItem[];
};

const PULSE_ICONS: Record<DashboardPulseItem['key'], TablerIcon> = {
    published: IconFileCheck,
    drafts: IconPencil,
    scheduled: IconCalendarEvent,
    pending_updates: IconRefresh,
};

export function DashboardPulse({ items }: DashboardPulseProps) {
    const { t } = useCanvas();

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-dashboard-pulse="true">
            {items.map((item) => {
                const Icon = PULSE_ICONS[item.key];
                const isPending = item.key === 'pending_updates' && item.value > 0;
                const isEmpty = item.value === 0;
                let pendingHint: string | null = null;

                if (isPending) {
                    pendingHint =
                        item.value === 1
                            ? t('dashboard.pulse_pending_hint_one', { count: item.value })
                            : t('dashboard.pulse_pending_hint_other', { count: item.value });
                }

                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={clsx(
                            'group rounded-xl border p-4 transition focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500',
                            isPending
                                ? 'border-amber-500/25 bg-amber-500/[0.04] hover:bg-amber-500/[0.07] dark:border-amber-400/20 dark:bg-amber-400/[0.06] dark:hover:bg-amber-400/[0.1]'
                                : 'border-zinc-950/10 hover:bg-zinc-950/[0.02] dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5 dark:hover:bg-white/[0.04]'
                        )}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                {t(DASHBOARD_PULSE_LABEL_KEYS[item.key])}
                            </Text>
                            <span
                                className={clsx(
                                    'inline-flex size-8 shrink-0 items-center justify-center rounded-lg',
                                    isPending
                                        ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300'
                                        : 'bg-zinc-950/5 text-zinc-500 group-hover:text-zinc-700 dark:bg-white/5 dark:text-zinc-400 dark:group-hover:text-zinc-200'
                                )}
                                aria-hidden="true"
                            >
                                <Icon className="size-4" stroke={1.75} />
                            </span>
                        </div>
                        <p
                            className={clsx(
                                'mt-2 text-2xl font-semibold tracking-tight tabular-nums',
                                isEmpty ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-950 dark:text-white'
                            )}
                        >
                            {item.value.toLocaleString()}
                        </p>
                        {pendingHint ? (
                            <p className="mt-1 text-xs leading-snug text-amber-800/80 dark:text-amber-200/80">
                                {pendingHint}
                            </p>
                        ) : null}
                    </Link>
                );
            })}
        </div>
    );
}
