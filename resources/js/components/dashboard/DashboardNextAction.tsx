import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import type { DashboardNextAction as NextAction } from '@/lib/dashboard';
import { IconArrowRight, IconPlus } from '@tabler/icons-react';

type DashboardNextActionProps = {
    action: NextAction;
};

export function DashboardNextAction({ action }: DashboardNextActionProps) {
    const { t } = useCanvas();
    const isWrite = action.kind === 'write';

    return (
        <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-950/10 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5"
            data-dashboard-next-action={action.kind}
        >
            <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-950 dark:text-white">{t(action.titleKey)}</p>
                <Text className="mt-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">{t(action.blurbKey)}</Text>
            </div>
            {isWrite ? (
                <Button href={action.href} color="dark/zinc">
                    <IconPlus data-slot="icon" />
                    {t(action.ctaKey)}
                </Button>
            ) : (
                <Button href={action.href} outline>
                    <IconArrowRight data-slot="icon" />
                    {t(action.ctaKey)}
                </Button>
            )}
        </div>
    );
}
