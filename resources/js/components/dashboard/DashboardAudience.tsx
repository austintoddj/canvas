import MetricHero from '@/components/analytics/MetricHero';
import RankedBarList from '@/components/analytics/RankedBarList';
import StatCard from '@/components/analytics/StatCard';
import { Button } from '@/components/button';
import { DashboardRangeDropdown } from '@/components/dashboard/DashboardRangeDropdown';
import { DashboardTopPosts } from '@/components/dashboard/DashboardTopPosts';
import { Subheading } from '@/components/heading';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { rankedWithShare } from '@/lib/analytics';
import {
    DASHBOARD_EMPTY_STATE_KEYS,
    DASHBOARD_RANKED_PREVIEW,
    DASHBOARD_RANGE_LABEL_KEYS,
    type DashboardAudienceMode,
    type DashboardChart,
    type DashboardScope,
    type DashboardStatCard,
} from '@/lib/dashboard';
import { postsIndexPath } from '@/lib/posts/list';
import type { DashboardRangeDays, DashboardTopPost } from '@/types/api';
import { useMemo } from 'react';

type DashboardAudienceProps = {
    mode: DashboardAudienceMode;
    viewsCard: DashboardStatCard;
    visitsCard: DashboardStatCard;
    viewsChart: DashboardChart;
    visitsChart: DashboardChart;
    topPosts: DashboardTopPost[];
    topReferers: Record<string, number>;
    scope: DashboardScope;
    rangeDays: DashboardRangeDays;
    onRangeChange: (days: DashboardRangeDays) => void;
    /** Prefer a concrete draft post when the library is drafts-only. */
    draftsCtaHref?: string;
};

export function DashboardAudience({
    mode,
    viewsCard,
    visitsCard,
    viewsChart,
    visitsChart,
    topPosts,
    topReferers,
    scope,
    rangeDays,
    onRangeChange,
    draftsCtaHref,
}: DashboardAudienceProps) {
    const { t } = useCanvas();
    const changeSuffix = t('dashboard.vs_prior_period');
    const changeNewLabel = t('stats.change_new');
    const rangeLabel = t(DASHBOARD_RANGE_LABEL_KEYS[rangeDays]);
    const referers = useMemo(() => rankedWithShare(topReferers, 50), [topReferers]);

    if (mode === 'cold') {
        return null;
    }

    if (mode === 'drafts_only') {
        const keys = DASHBOARD_EMPTY_STATE_KEYS.drafts_only;

        return (
            <section className="space-y-3" data-dashboard-audience={mode}>
                <AudienceHeader rangeDays={rangeDays} onRangeChange={onRangeChange} />
                <div className="rounded-xl border border-zinc-950/10 px-5 py-5 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5">
                    <p className="text-sm font-medium text-zinc-950 dark:text-white">{t(keys.headline)}</p>
                    <Text className="mt-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">{t(keys.blurb)}</Text>
                    <div className="mt-4">
                        <Button href={draftsCtaHref ?? postsIndexPath({ tab: 'draft', scope })} outline>
                            {t(keys.cta)}
                        </Button>
                    </div>
                </div>
            </section>
        );
    }

    if (mode === 'waiting_readers') {
        const keys = DASHBOARD_EMPTY_STATE_KEYS.no_traffic;

        return (
            <section className="space-y-4" data-dashboard-audience={mode}>
                <AudienceHeader rangeDays={rangeDays} onRangeChange={onRangeChange} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard label={viewsCard.label} value={viewsCard.value} />
                    <StatCard label={visitsCard.label} value={visitsCard.value} />
                </div>
                <div
                    className="rounded-xl border border-zinc-950/10 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5"
                    data-dashboard-traffic-hint="true"
                >
                    <p className="text-sm font-medium text-zinc-950 dark:text-white">{t(keys.headline)}</p>
                    <p className="mt-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">{t(keys.blurb)}</p>
                    <div className="mt-3">
                        <Button href={postsIndexPath({ scope })} outline>
                            {t(keys.cta)}
                        </Button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-4" data-dashboard-audience="active">
            <AudienceHeader rangeDays={rangeDays} onRangeChange={onRangeChange} />

            <div className="grid items-stretch gap-4 lg:grid-cols-2">
                <MetricHero
                    label={viewsCard.label}
                    value={viewsCard.value}
                    change={viewsCard.change}
                    changeSuffix={changeSuffix}
                    newLabel={changeNewLabel}
                    series={viewsChart.data}
                    caption={rangeLabel}
                    emptyLabel={t('stats.no_data')}
                />
                <MetricHero
                    label={visitsCard.label}
                    value={visitsCard.value}
                    change={visitsCard.change}
                    changeSuffix={changeSuffix}
                    newLabel={changeNewLabel}
                    series={visitsChart.data}
                    caption={rangeLabel}
                    emptyLabel={t('stats.no_data')}
                />
            </div>

            <div className="grid items-stretch gap-4 lg:grid-cols-2">
                <DashboardTopPosts posts={topPosts} rangeLabel={rangeLabel} previewLimit={DASHBOARD_RANKED_PREVIEW} />
                <RankedBarList
                    title={t('stats.top_referers')}
                    entries={referers}
                    emptyLabel={t('dashboard.referers_empty')}
                    iconKind="referer"
                    previewLimit={DASHBOARD_RANKED_PREVIEW}
                    searchPlaceholder={t('stats.search_list')}
                    exportLabel={t('stats.export_csv')}
                    closeLabel={t('stats.close_list')}
                    viewAllLabel={t('stats.view_all')}
                    valueColumnLabel={t('stats.metric_views')}
                    csvFilename="referers.csv"
                />
            </div>
        </section>
    );
}

function AudienceHeader({
    rangeDays,
    onRangeChange,
}: {
    rangeDays: DashboardRangeDays;
    onRangeChange: (days: DashboardRangeDays) => void;
}) {
    const { t } = useCanvas();

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <Subheading level={2}>{t('dashboard.section_audience')}</Subheading>
            <DashboardRangeDropdown value={rangeDays} onChange={onRangeChange} />
        </div>
    );
}
