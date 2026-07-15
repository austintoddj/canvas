import { parseDailyGraph, type DailyDataPoint } from '@/lib/analytics';
import type { DashboardInsights, StatsIndexParams } from '@/types/api';

export type DashboardScope = NonNullable<StatsIndexParams['scope']>;

export type DashboardStatCard = {
    key: 'views' | 'visits';
    label: string;
    value: number;
};

export type DashboardChart = {
    key: 'views' | 'visits';
    title: string;
    data: DailyDataPoint[];
};

export type DashboardPresentation = {
    cards: DashboardStatCard[];
    charts: DashboardChart[];
    totalActivity: number;
};

export function parseDashboardScope(value: string | null | undefined): DashboardScope {
    return value === 'all' ? 'all' : 'user';
}

export function dashboardStatsParams(scope: DashboardScope): StatsIndexParams {
    return scope === 'all' ? { scope: 'all' } : { scope: 'user' };
}

export function mapDashboardInsights(
    insights: DashboardInsights,
    labels?: { views: string; visits: string }
): DashboardPresentation {
    const viewsSeries = parseDailyGraph(insights.graph.views);
    const visitsSeries = parseDailyGraph(insights.graph.visits);
    const viewsLabel = labels?.views ?? 'Views (last 30 days)';
    const visitsLabel = labels?.visits ?? 'Visits (last 30 days)';

    return {
        cards: [
            { key: 'views', label: viewsLabel, value: insights.views },
            { key: 'visits', label: visitsLabel, value: insights.visits },
        ],
        charts: [
            { key: 'views', title: viewsLabel, data: viewsSeries },
            { key: 'visits', title: visitsLabel, data: visitsSeries },
        ],
        totalActivity: insights.views + insights.visits,
    };
}

export function isZeroActivity(presentation: DashboardPresentation): boolean {
    return presentation.totalActivity === 0;
}

export const DASHBOARD_EMPTY_STATE_KEYS = {
    headline: 'dashboard.empty_headline',
    blurb: 'dashboard.empty_blurb',
    cta: 'dashboard.empty_cta',
} as const;
