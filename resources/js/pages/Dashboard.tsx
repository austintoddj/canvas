import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DashboardEmptyVisual } from '@/components/analytics/DashboardEmptyVisual';
import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { DashboardAudience } from '@/components/dashboard/DashboardAudience';
import { DashboardPipeline } from '@/components/dashboard/DashboardPipeline';
import { DashboardRecentPosts } from '@/components/dashboard/DashboardRecentPosts';
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
import { isInitialLoading, isRefreshing } from '@/lib/async-ui';
import { statsApi } from '@/lib/api/stats';
import {
    DASHBOARD_DEFAULT_RANGE,
    DASHBOARD_EMPTY_STATE_KEYS,
    dashboardStatsParams,
    greetingKey,
    greetingSummaryParts,
    mapDashboardInsights,
    parseDashboardRange,
    parseDashboardScope,
    type DashboardPresentation,
    type DashboardScope,
} from '@/lib/dashboard';
import type { DashboardRangeDays } from '@/types/api';

function DashboardSkeleton() {
    return (
        <div className="space-y-8" aria-hidden="true">
            <div className="space-y-3">
                <Skeleton className="h-4 w-40" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            </div>
            <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <div className="grid gap-4 lg:grid-cols-2">
                    <Skeleton className="h-72 w-full" />
                    <Skeleton className="h-72 w-full" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
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
    const rangeDays = parseDashboardRange(searchParams.get('days'));
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
            .index(dashboardStatsParams(effectiveScope, rangeDays), controller.signal)
            .then((insights) => {
                if (!cancelled) {
                    setPresentation(
                        mapDashboardInsights(
                            insights,
                            {
                                views: t('dashboard.views_30'),
                                visits: t('dashboard.visits_30'),
                            },
                            effectiveScope,
                            rangeDays
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
    }, [effectiveScope, rangeDays, t]);

    function setScope(next: DashboardScope) {
        const params = new URLSearchParams(searchParams);

        if (next === 'all') {
            params.set('scope', 'all');
        } else {
            params.delete('scope');
        }

        setSearchParams(params, { replace: true });
    }

    function setRange(next: DashboardRangeDays) {
        const params = new URLSearchParams(searchParams);

        if (next === DASHBOARD_DEFAULT_RANGE) {
            params.delete('days');
        } else {
            params.set('days', String(next));
        }

        setSearchParams(params, { replace: true });
    }

    const itemCount = presentation === null ? 0 : 1;
    const showInitialSkeleton = isInitialLoading(loading, itemCount);
    const refreshing = isRefreshing(loading, itemCount);
    const { animateEmpty, animateContent } = useAsyncReveal(loading, itemCount);

    const viewsCard = presentation?.cards.find((card) => card.key === 'views');
    const visitsCard = presentation?.cards.find((card) => card.key === 'visits');
    const viewsChart = presentation?.charts.find((chart) => chart.key === 'views');
    const visitsChart = presentation?.charts.find((chart) => chart.key === 'visits');

    const firstName = user.name.trim().split(/\s+/)[0] || user.name;
    const greeting = t(greetingKey(), { name: firstName });
    const viewsCount = presentation?.cards.find((card) => card.key === 'views')?.value ?? 0;
    const summaryParts = presentation
        ? greetingSummaryParts(presentation.library.drafts, viewsCount, presentation.rangeDays)
        : null;
    const pulseSummary = summaryParts
        ? t('dashboard.greeting_summary', {
              drafts: t(summaryParts.draftKey, { count: summaryParts.drafts }),
              views: t(summaryParts.viewsKey, {
                  count: summaryParts.views.toLocaleString(),
                  period: t(summaryParts.periodKey),
              }),
          })
        : null;

    const emptyKeys = presentation ? DASHBOARD_EMPTY_STATE_KEYS[presentation.emptyKind] : null;
    const draftsCtaHref =
        presentation?.pipeline.drafts[0] !== undefined ? `/posts/${presentation.pipeline.drafts[0].id}` : undefined;
    const isCold = presentation?.audienceMode === 'cold';
    /** One create affordance at a time: cold empty state owns Write; otherwise quiet header New post. */
    const showHeaderNewPost = presentation !== null && !isCold;

    return (
        <div className="space-y-8">
            <PageHeader
                title={greeting}
                actions={
                    showHeaderNewPost ? (
                        <Button href="/posts/new" outline>
                            {t('posts.new')}
                        </Button>
                    ) : undefined
                }
            >
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
                    <DashboardPipeline
                        pipeline={presentation.pipeline}
                        scope={presentation.scope}
                        totals={{
                            drafts: presentation.library.drafts,
                            scheduled: presentation.library.scheduled,
                            pending: presentation.library.pending_updates,
                        }}
                    />

                    {presentation.audienceMode === 'cold' ? (
                        <EmptyStateReveal animate={animateEmpty}>
                            <EmptyState
                                headline={t(emptyKeys.headline)}
                                description={t(emptyKeys.blurb)}
                                visual={<DashboardEmptyVisual />}
                                action={
                                    <Button href={emptyKeys.href} color="dark/zinc">
                                        {t(emptyKeys.cta)}
                                    </Button>
                                }
                            />
                        </EmptyStateReveal>
                    ) : (
                        <DashboardAudience
                            mode={presentation.audienceMode}
                            viewsCard={viewsCard}
                            visitsCard={visitsCard}
                            viewsChart={viewsChart}
                            visitsChart={visitsChart}
                            topPosts={presentation.topPosts}
                            topReferers={presentation.topReferers}
                            scope={presentation.scope}
                            rangeDays={presentation.rangeDays}
                            onRangeChange={setRange}
                            draftsCtaHref={draftsCtaHref}
                        />
                    )}

                    <DashboardRecentPosts posts={presentation.recentPosts} scope={presentation.scope} />
                </ContentReveal>
            ) : null}
        </div>
    );
}
