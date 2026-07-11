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

export function mapDashboardInsights(insights: DashboardInsights): DashboardPresentation {
    const viewsSeries = parseDailyGraph(insights.graph.views);
    const visitsSeries = parseDailyGraph(insights.graph.visits);

    return {
        cards: [
            { key: 'views', label: 'Views (last 30 days)', value: insights.views },
            { key: 'visits', label: 'Visits (last 30 days)', value: insights.visits },
        ],
        charts: [
            { key: 'views', title: 'Views (last 30 days)', data: viewsSeries },
            { key: 'visits', title: 'Visits (last 30 days)', data: visitsSeries },
        ],
        totalActivity: insights.views + insights.visits,
    };
}

export function isZeroActivity(presentation: DashboardPresentation): boolean {
    return presentation.totalActivity === 0;
}

export const DASHBOARD_EMPTY_STATE = {
    headline: 'No traffic yet',
    blurb: 'Publish a post and send readers its way — views and visits for the last 30 days will show up here.',
    cta: 'Write a post',
} as const;
