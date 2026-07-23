import { IconExternalLink } from '@tabler/icons-react';

import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';

const PUBLISH_COMMAND = 'php artisan canvas:publish';
const DOCS_URL = 'https://github.com/austintoddj/canvas#upgrading';

const docsLinkClass =
    'inline-flex items-center gap-1 font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:decoration-blue-400';

export function AssetsOutdatedCallout() {
    const { t } = useCanvas();

    return (
        <div
            className="flex flex-col gap-4 rounded-xl border border-red-500/25 bg-red-500/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-400/30 dark:bg-red-400/[0.04]"
            data-assets-outdated="true"
            role="status"
        >
            <div className="min-w-0 space-y-2">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{t('assets_are_not_up_to_date')}</p>
                <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">{t('to_update_run')}</Text>
                <p className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                    <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className={docsLinkClass}>
                        {t('assets_docs_link')}
                        <IconExternalLink className="size-3.5 shrink-0" aria-hidden />
                    </a>
                </p>
            </div>
            <code className="shrink-0 rounded-lg bg-zinc-950/5 px-3 py-2 font-mono text-sm font-medium text-zinc-950 ring-1 ring-zinc-950/10 dark:bg-white/5 dark:text-white dark:ring-white/10">
                {PUBLISH_COMMAND}
            </code>
        </div>
    );
}
