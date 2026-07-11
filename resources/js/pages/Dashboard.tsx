import { PlusIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import DailyBarChart from '@/components/analytics/DailyBarChart';
import { DashboardEmptyVisual } from '@/components/analytics/DashboardEmptyVisual';
import StatCard from '@/components/analytics/StatCard';
import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { EmptyState } from '@/components/EmptyState';
import { EmptyStateReveal } from '@/components/EmptyStateReveal';
import { PageHeader } from '@/components/PageHeader';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { Skeleton } from '@/components/Skeleton';
import { PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { usePermissions } from '@/hooks/usePermissions';
import { isInitialLoading, isRefreshing } from '@/lib/async-ui';
import { statsApi } from '@/lib/api/stats';
import {
    DASHBOARD_EMPTY_STATE,
    dashboardStatsParams,
    isZeroActivity,
    mapDashboardInsights,
    parseDashboardScope,
    type DashboardPresentation,
    type DashboardScope,
} from '@/lib/dashboard';

function DashboardSkeleton() {
    return (
        <div className="space-y-8" aria-hidden="true">
            <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { canViewAllPosts } = usePermissions();
    const [searchParams, setSearchParams] = useSearchParams();
    const scope = parseDashboardScope(searchParams.get('scope'));
    const effectiveScope: DashboardScope = canViewAllPosts ? scope : 'user';

    const [presentation, setPresentation] = useState<DashboardPresentation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                    setPresentation(mapDashboardInsights(insights));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Unable to load dashboard stats.');
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
    }, [effectiveScope]);

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

    return (
        <div className="space-y-8">
            <PageHeader title="Dashboard">
                <PageDescription>Views and visits for the last 30 days</PageDescription>
            </PageHeader>

            {canViewAllPosts ? (
                <PillNav value={effectiveScope} onChange={setScope} aria-label="Dashboard author scope">
                    <PillNavItem value="user">Mine</PillNavItem>
                    <PillNavItem value="all">All authors</PillNavItem>
                </PillNav>
            ) : null}

            {error ? <ErrorText>{error}</ErrorText> : null}

            {showInitialSkeleton ? (
                <DashboardSkeleton />
            ) : presentation ? (
                <ContentReveal className="space-y-8" busy={refreshing} animate={animateContent}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {presentation.cards.map((card) => (
                            <StatCard key={card.key} label={card.label} value={card.value} />
                        ))}
                    </div>

                    {zeroActivity ? (
                        <EmptyStateReveal animate={animateEmpty}>
                            <EmptyState
                                headline={DASHBOARD_EMPTY_STATE.headline}
                                description={DASHBOARD_EMPTY_STATE.blurb}
                                visual={<DashboardEmptyVisual />}
                                action={
                                    <Button href="/posts/new" color="dark/zinc">
                                        <PlusIcon data-slot="icon" />
                                        {DASHBOARD_EMPTY_STATE.cta}
                                    </Button>
                                }
                            />
                        </EmptyStateReveal>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-2">
                            {presentation.charts.map((chart) => (
                                <DailyBarChart key={chart.key} title={chart.title} data={chart.data} />
                            ))}
                        </div>
                    )}
                </ContentReveal>
            ) : null}
        </div>
    );
}
