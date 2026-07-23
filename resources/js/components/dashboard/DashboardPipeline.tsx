import { useNavigate } from 'react-router-dom';

import { Subheading } from '@/components/heading';
import { Link } from '@/components/link';
import { useCanvas } from '@/hooks/useCanvas';
import { pipelineHasItems, type DashboardScope } from '@/lib/dashboard';
import { formatListDate } from '@/lib/format-list-date';
import { postsIndexPath } from '@/lib/posts/list';
import type { DashboardPipeline, DashboardPipelinePost } from '@/types/api';
import clsx from 'clsx';

type DashboardPipelineProps = {
    pipeline: DashboardPipeline;
    scope: DashboardScope;
    totals: {
        drafts: number;
        scheduled: number;
        pending: number;
    };
};

type ColumnKey = 'pending' | 'drafts' | 'scheduled';

type ColumnConfig = {
    key: ColumnKey;
    titleKey: string;
    accent?: 'amber';
    viewAllHref: (scope: DashboardScope) => string;
};

const COLUMNS: ColumnConfig[] = [
    {
        key: 'pending',
        titleKey: 'dashboard.pipeline_pending',
        accent: 'amber',
        viewAllHref: (scope) => postsIndexPath({ scope }),
    },
    {
        key: 'drafts',
        titleKey: 'dashboard.pipeline_drafts',
        viewAllHref: (scope) => postsIndexPath({ tab: 'draft', scope }),
    },
    {
        key: 'scheduled',
        titleKey: 'dashboard.pipeline_scheduled',
        viewAllHref: (scope) => postsIndexPath({ tab: 'draft', scope }),
    },
];

function columnMeta(
    key: ColumnKey,
    post: DashboardPipelinePost,
    t: (key: string, replacements?: Record<string, string | number>) => string
): string {
    if (key === 'pending') {
        return t('dashboard.pipeline_pending_cue');
    }

    if (key === 'scheduled' && post.published_at) {
        return t('dashboard.pipeline_goes_live', { date: formatListDate(post.published_at) });
    }

    if (key === 'drafts') {
        return t('dashboard.pipeline_updated', { date: formatListDate(post.updated_at) });
    }

    return '';
}

export function DashboardPipeline({ pipeline, scope, totals }: DashboardPipelineProps) {
    const { t } = useCanvas();
    const navigate = useNavigate();

    if (!pipelineHasItems(pipeline)) {
        return null;
    }

    const visibleColumns = COLUMNS.filter((column) => pipeline[column.key].length > 0);
    const columnCount = visibleColumns.length;

    return (
        <section className="space-y-3" data-dashboard-pipeline="true">
            <Subheading level={2}>{t('dashboard.pipeline_title')}</Subheading>

            <div
                className={clsx(
                    'grid gap-4',
                    columnCount === 1 && 'grid-cols-1',
                    columnCount === 2 && 'sm:grid-cols-2',
                    columnCount >= 3 && 'lg:grid-cols-3 sm:grid-cols-2'
                )}
            >
                {visibleColumns.map((column) => {
                    const posts = pipeline[column.key];
                    const total =
                        column.key === 'pending'
                            ? totals.pending
                            : column.key === 'drafts'
                              ? totals.drafts
                              : totals.scheduled;
                    const showViewAll = total > posts.length;

                    return (
                        <div
                            key={column.key}
                            className={clsx(
                                'flex flex-col rounded-xl border p-4 dark:ring-1 dark:ring-white/5',
                                column.accent === 'amber'
                                    ? 'border-amber-500/25 bg-amber-500/[0.03] dark:border-amber-400/20 dark:bg-amber-400/[0.05]'
                                    : 'border-zinc-950/10 dark:border-white/10 dark:bg-white/[0.02]'
                            )}
                            data-dashboard-pipeline-column={column.key}
                        >
                            <div className="flex items-baseline justify-between gap-2">
                                <h3 className="text-sm font-medium text-zinc-950 dark:text-white">
                                    {t(column.titleKey)}
                                </h3>
                                <span className="text-xs tabular-nums text-canvas-muted dark:text-canvas-muted-dark">
                                    {total.toLocaleString()}
                                </span>
                            </div>

                            <ul className="mt-3 space-y-1">
                                {posts.map((post) => {
                                    const rawTitle = (post.title ?? '').trim();
                                    const title = rawTitle === '' ? t('editor.untitled_post') : rawTitle;
                                    const meta = columnMeta(column.key, post, t);

                                    return (
                                        <li key={post.id}>
                                            <button
                                                type="button"
                                                className="w-full rounded-lg px-2 py-2 text-left transition hover:bg-zinc-950/[0.04] focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-white/[0.05]"
                                                onClick={() => navigate(`/posts/${post.id}`)}
                                                aria-label={t('dashboard.recent_edit_aria', { title })}
                                            >
                                                <span className="block truncate text-sm font-medium text-zinc-950 dark:text-white">
                                                    {title}
                                                </span>
                                                {meta !== '' ? (
                                                    <span
                                                        className={
                                                            column.key === 'pending'
                                                                ? 'mt-0.5 block truncate text-xs text-amber-800/80 dark:text-amber-200/80'
                                                                : 'mt-0.5 block truncate text-xs text-canvas-muted dark:text-canvas-muted-dark'
                                                        }
                                                    >
                                                        {meta}
                                                    </span>
                                                ) : null}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>

                            {showViewAll ? (
                                <div className="mt-auto pt-3">
                                    <Link
                                        href={column.viewAllHref(scope)}
                                        className="text-sm font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                                    >
                                        {t('dashboard.pipeline_view_all')}
                                    </Link>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
