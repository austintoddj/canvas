import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import MetricHero from '@/components/analytics/MetricHero';
import RankedBarList from '@/components/analytics/RankedBarList';
import { DashboardEmptyVisual } from '@/components/analytics/DashboardEmptyVisual';
import StatCard from '@/components/analytics/StatCard';
import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { DashboardNextAction } from '@/components/dashboard/DashboardNextAction';
import { DashboardPulse } from '@/components/dashboard/DashboardPulse';
import { DashboardRecentPosts } from '@/components/dashboard/DashboardRecentPosts';
import { DashboardTopPosts } from '@/components/dashboard/DashboardTopPosts';
import { EmptyState } from '@/components/EmptyState';
import { EmptyStateReveal } from '@/components/EmptyStateReveal';
import { PageHeader } from '@/components/PageHeader';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { Skeleton } from '@/components/Skeleton';
import { PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePermissions } from '@/hooks/usePermissions';
import { rankedWithShare } from '@/lib/analytics';
import { isInitialLoading, isRefreshing } from '@/lib/async-ui';
import { statsApi } from '@/lib/api/stats';
import {
    DASHBOARD_EMPTY_STATE_KEYS,
    dashboardStatsParams,
    greetingKey,
    greetingSummaryParts,
    isZeroActivity,
    mapDashboardInsights,
    parseDashboardScope,
    type DashboardPresentation,
    type DashboardScope,
} from '@/lib/dashboard';
import { postsIndexPath } from '@/lib/posts/list';
import { IconPlus } from '@tabler/icons-react';

function DashboardSkeleton() {
    return (
        <div className="space-y-8" aria-hidden="true">
            <Skeleton className="h-16 w-full max-w-xl" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
            </div>
            <div className="grid gap-4 lg:grid-cols-5">
                <Skeleton className="h-72 w-full lg:col-span-3" />
                <Skeleton className="h-72 w-full lg:col-span-2" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { t, user } = useCanvas();
    const { canViewAllPosts } = usePermissions();
    const [searchParams, setSearchParams] = useSearchParams();
    const scope = parseDashboardScope(searchParams.get('scope'));
    const effectiveScope: DashboardScope = canViewAllPosts ? scope : 'user';

    const [presentation, setPresentation] = useState<DashboardPresentation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useDocumentTitle(t('dashboard.title'));

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        queueMicrotask(() => {
            if (!cancelled) {
                setLoading(true);
                setError(null);
            }
        });

        statsApi
            .index(dashboardStatsParams(effectiveScope), controller.signal)
            .then((insights) => {
                if (!cancelled) {
                    setPresentation(
                        mapDashboardInsights(
                            insights,
                            {
                                views: t('dashboard.views_30'),
                                visits: t('dashboard.visits_30'),
                            },
                            effectiveScope
                        )
                    );
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(t('dashboard.load_error'));
                    setPresentation(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [effectiveScope, t]);

    function setScope(next: DashboardScope) {
        const params = new URLSearchParams(searchParams);

        if (next === 'all') {
            params.set('scope', 'all');
        } else {
            params.delete('scope');
        }

        setSearchParams(params, { replace: true });
    }

    const itemCount = presentation === null ? 0 : 1;
    const showInitialSkeleton = isInitialLoading(loading, itemCount);
    const refreshing = isRefreshing(loading, itemCount);
    const { animateEmpty, animateContent } = useAsyncReveal(loading, itemCount);
    const zeroActivity = presentation !== null && isZeroActivity(presentation);

    const viewsCard = presentation?.cards.find((card) => card.key === 'views');
    const visitsCard = presentation?.cards.find((card) => card.key === 'visits');
    const viewsChart = presentation?.charts.find((chart) => chart.key === 'views');
    const visitsChart = presentation?.charts.find((chart) => chart.key === 'visits');

    const emptyKeys = presentation ? DASHBOARD_EMPTY_STATE_KEYS[presentation.emptyKind] : null;
    const emptyHref =
        presentation?.emptyKind === 'drafts_only'
            ? postsIndexPath({ tab: 'draft', scope: effectiveScope })
            : presentation?.emptyKind === 'no_traffic'
              ? postsIndexPath({ scope: effectiveScope })
              : emptyKeys?.href;

    const referers = useMemo(() => (presentation ? rankedWithShare(presentation.topReferers, 50) : []), [presentation]);

    const firstName = user.name.trim().split(/\s+/)[0] || user.name;
    const greeting = t(greetingKey(), { name: firstName });
    const viewsCount = presentation?.cards.find((card) => card.key === 'views')?.value ?? 0;
    const summaryParts = presentation ? greetingSummaryParts(presentation.library.drafts, viewsCount) : null;
    const pulseSummary = summaryParts
        ? t('dashboard.greeting_summary', {
              drafts: t(summaryParts.draftKey, { count: summaryParts.drafts }),
              views: t(summaryParts.viewsKey, { count: summaryParts.views.toLocaleString() }),
          })
        : null;

    const changeSuffix = t('stats.vs_prior_period');
    const changeNewLabel = t('stats.change_new');

    return (
        <div className="space-y-8">
            <PageHeader title={greeting}>
                <PageDescription>{pulseSummary ?? t('dashboard.description')}</PageDescription>
            </PageHeader>

            {canViewAllPosts ? (
                <PillNav value={effectiveScope} onChange={setScope} aria-label={t('dashboard.scope_label')}>
                    <PillNavItem value="user">{t('dashboard.scope_mine')}</PillNavItem>
                    <PillNavItem value="all">{t('dashboard.scope_all')}</PillNavItem>
                </PillNav>
            ) : null}

            {error ? <ErrorText>{error}</ErrorText> : null}

            {showInitialSkeleton ? (
                <DashboardSkeleton />
            ) : presentation && viewsCard && visitsCard && viewsChart && visitsChart && emptyKeys ? (
                <ContentReveal className="space-y-8" busy={refreshing} animate={animateContent}>
                    {presentation.nextAction ? <DashboardNextAction action={presentation.nextAction} /> : null}

                    {presentation.hasPosts ? <DashboardPulse items={presentation.pulse} /> : null}

                    {zeroActivity ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <StatCard label={viewsCard.label} value={viewsCard.value} />
                                <StatCard label={visitsCard.label} value={visitsCard.value} />
                            </div>

                            {presentation.emptyKind === 'no_posts' || !presentation.hasPosts ? (
                                <EmptyStateReveal animate={animateEmpty}>
                                    <EmptyState
                                        headline={t(emptyKeys.headline)}
                                        description={t(emptyKeys.blurb)}
                                        visual={<DashboardEmptyVisual />}
                                        action={
                                            presentation.nextAction ? undefined : (
                                                <Button href={emptyHref ?? emptyKeys.href} color="dark/zinc">
                                                    <IconPlus data-slot="icon" />
                                                    {t(emptyKeys.cta)}
                                                </Button>
                                            )
                                        }
                                    />
                                </EmptyStateReveal>
                            ) : (
                                <div
                                    className="rounded-xl border border-zinc-950/10 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5"
                                    data-dashboard-traffic-hint="true"
                                >
                                    <p className="text-sm font-medium text-zinc-950 dark:text-white">
                                        {t(emptyKeys.headline)}
                                    </p>
                                    <p className="mt-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                        {t(emptyKeys.blurb)}
                                    </p>
                                    {!presentation.nextAction ? (
                                        <div className="mt-3">
                                            <Button href={emptyHref ?? emptyKeys.href} outline>
                                                {t(emptyKeys.cta)}
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="grid items-stretch gap-4 lg:grid-cols-5">
                                <div className="min-h-0 lg:col-span-3">
                                    <MetricHero
                                        label={viewsCard.label}
                                        value={viewsCard.value}
                                        change={viewsCard.change}
                                        changeSuffix={changeSuffix}
                                        newLabel={changeNewLabel}
                                        series={viewsChart.data}
                                        caption={t('stats.last_30_days')}
                                        emptyLabel={t('stats.no_data')}
                                    />
                                </div>
                                <div className="min-h-0 lg:col-span-2">
                                    <DashboardTopPosts posts={presentation.topPosts} />
                                </div>
                            </div>

                            <div className="grid items-start gap-4 lg:grid-cols-2">
                                <StatCard
                                    label={visitsCard.label}
                                    value={visitsCard.value}
                                    change={visitsCard.change}
                                    changeSuffix={changeSuffix}
                                    newLabel={changeNewLabel}
                                    sparkline={visitsChart.data}
                                />
                                <RankedBarList
                                    title={t('stats.top_referers')}
                                    entries={referers}
                                    emptyLabel={t('stats.no_data')}
                                    iconKind="referer"
                                    previewLimit={5}
                                    searchPlaceholder={t('stats.search_list')}
                                    exportLabel={t('stats.export_csv')}
                                    closeLabel={t('stats.close_list')}
                                    viewAllLabel={t('stats.view_all')}
                                    valueColumnLabel={t('stats.metric_views')}
                                    csvFilename="referers.csv"
                                />
                            </div>
                        </>
                    )}

                    <DashboardRecentPosts posts={presentation.recentPosts} />
                </ContentReveal>
            ) : null}
        </div>
    );
}
