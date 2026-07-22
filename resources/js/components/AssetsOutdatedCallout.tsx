import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';

const PUBLISH_COMMAND = 'php artisan canvas:publish';

export function AssetsOutdatedCallout() {
    const { t } = useCanvas();

    return (
        <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-950/10 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5"
            data-assets-outdated="true"
            role="status"
        >
            <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-950 dark:text-white">{t('assets_are_not_up_to_date')}</p>
                <Text className="mt-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">{t('to_update_run')}</Text>
            </div>
            <code className="rounded-lg bg-zinc-950/5 px-3 py-2 font-mono text-sm font-medium text-zinc-950 ring-1 ring-zinc-950/10 dark:bg-white/5 dark:text-white dark:ring-white/10">
                {PUBLISH_COMMAND}
            </code>
        </div>
    );
}
