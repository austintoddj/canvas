import { IconExternalLink } from '@tabler/icons-react';

import { useCanvas } from '@/hooks/useCanvas';

const PUBLISH_COMMAND = 'php artisan canvas:publish';
const DOCS_URL = 'https://github.com/austintoddj/canvas#upgrading';

const docsLinkClass =
    'inline-flex items-center gap-1 font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:decoration-blue-400';

export function AssetsOutdatedCallout() {
    const { t } = useCanvas();

    return (
        <div
            className="flex min-w-0 flex-col gap-2 rounded-xl border border-zinc-950/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.02]"
            data-assets-outdated="true"
            role="status"
        >
            <p className="flex items-start gap-2 text-sm font-medium text-zinc-950 dark:text-white">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                {t('assets_are_not_up_to_date')}
            </p>
            <code className="block w-full max-w-full overflow-x-auto whitespace-nowrap rounded-lg bg-zinc-950/5 px-3 py-2 font-mono text-sm font-medium text-zinc-950 ring-1 ring-zinc-950/10 dark:bg-white/5 dark:text-white dark:ring-white/10">
                {PUBLISH_COMMAND}
            </code>
            <p className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className={docsLinkClass}>
                    {t('assets_docs_link')}
                    <IconExternalLink className="size-3.5 shrink-0" aria-hidden />
                </a>
            </p>
        </div>
    );
}
