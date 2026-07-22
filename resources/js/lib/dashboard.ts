import { parseDailyGraph, type DailyDataPoint } from '@/lib/analytics';
import type {
    DashboardInsights,
    DashboardLibrary,
    DashboardPipeline,
    DashboardRangeDays,
    DashboardRecentPost,
    DashboardTopPost,
    MonthOverMonth,
    StatsIndexParams,
} from '@/types/api';

export type DashboardScope = NonNullable<StatsIndexParams['scope']>;

export type DashboardStatCard = {
    key: 'views' | 'visits';
    label: string;
    value: number;
    change?: MonthOverMonth;
};

export type DashboardChart = {
    key: 'views' | 'visits';
    title: string;
    data: DailyDataPoint[];
};

export type DashboardEmptyKind = 'no_posts' | 'drafts_only' | 'no_traffic';

export type DashboardAudienceMode = 'cold' | 'drafts_only' | 'waiting_readers' | 'active';

export type DashboardGreetingPeriod = 'morning' | 'afternoon' | 'evening';

export const DASHBOARD_RANGE_DAYS = [7, 30, 90, 365] as const satisfies readonly DashboardRangeDays[];

export const DASHBOARD_DEFAULT_RANGE: DashboardRangeDays = 30;

/** Shared preview row count for Most viewed + referers side-by-side cards. */
export const DASHBOARD_RANKED_PREVIEW = 5;

export const DASHBOARD_RANGE_LABEL_KEYS = {
    7: 'dashboard.range_7',
    30: 'dashboard.range_30',
    90: 'dashboard.range_90',
    365: 'dashboard.range_365',
} as const satisfies Record<DashboardRangeDays, string>;

export type DashboardPresentation = {
    cards: DashboardStatCard[];
    charts: DashboardChart[];
    totalActivity: number;
    rangeDays: DashboardRangeDays;
    library: DashboardLibrary;
    pipeline: DashboardPipeline;
    recentPosts: DashboardRecentPost[];
    topPosts: DashboardTopPost[];
    topReferers: Record<string, number>;
    emptyKind: DashboardEmptyKind;
    audienceMode: DashboardAudienceMode;
    hasPosts: boolean;
    monthOverMonthViews: MonthOverMonth;
    monthOverMonthVisits: MonthOverMonth;
    scope: DashboardScope;
};

export function parseDashboardScope(value: string | null | undefined): DashboardScope {
    return value === 'all' ? 'all' : 'user';
}

export function parseDashboardRange(value: string | null | undefined): DashboardRangeDays {
    const days = Number.parseInt(value ?? '', 10);

    if (days === 7 || days === 30 || days === 90 || days === 365) {
        return days;
    }

    return DASHBOARD_DEFAULT_RANGE;
}

export function dashboardStatsParams(
    scope: DashboardScope,
    days: DashboardRangeDays = DASHBOARD_DEFAULT_RANGE
): StatsIndexParams {
    const params: StatsIndexParams = {};

    if (scope === 'all') {
        params.scope = 'all';
    }

    if (days !== DASHBOARD_DEFAULT_RANGE) {
        params.days = days;
    }

    return params;
}

export function emptyLibrary(): DashboardLibrary {
    return {
        published: 0,
        drafts: 0,
        scheduled: 0,
        pending_updates: 0,
    };
}

export function emptyPipeline(): DashboardPipeline {
    return {
        drafts: [],
        scheduled: [],
        pending: [],
    };
}

export function emptyMonthOverMonth(): MonthOverMonth {
    return { direction: 'down', percentage: '0', comparable: false };
}

export function greetingPeriodKey(rangeDays: DashboardRangeDays): string {
    return `dashboard.greeting_period_${rangeDays}`;
}

export function greetingSummaryParts(
    drafts: number,
    views: number,
    rangeDays: DashboardRangeDays = DASHBOARD_DEFAULT_RANGE
): { draftKey: string; viewsKey: string; periodKey: string; drafts: number; views: number } {
    return {
        draftKey: drafts === 1 ? 'dashboard.greeting_drafts_one' : 'dashboard.greeting_drafts_other',
        viewsKey: views === 1 ? 'dashboard.greeting_views_one' : 'dashboard.greeting_views_other',
        periodKey: greetingPeriodKey(rangeDays),
        drafts,
        views,
    };
}

export function libraryPostCount(library: DashboardLibrary): number {
    return library.published + library.drafts + library.scheduled;
}

export function dashboardEmptyKind(library: DashboardLibrary): DashboardEmptyKind {
    if (libraryPostCount(library) === 0) {
        return 'no_posts';
    }

    if (library.published === 0) {
        return 'drafts_only';
    }

    return 'no_traffic';
}

export function dashboardAudienceMode(library: DashboardLibrary, totalActivity: number): DashboardAudienceMode {
    if (libraryPostCount(library) === 0) {
        return 'cold';
    }

    if (library.published === 0) {
        return 'drafts_only';
    }

    if (totalActivity === 0) {
        return 'waiting_readers';
    }

    return 'active';
}

export function pipelineHasItems(pipeline: DashboardPipeline): boolean {
    return pipeline.drafts.length > 0 || pipeline.scheduled.length > 0 || pipeline.pending.length > 0;
}

export function greetingPeriod(now: Date = new Date()): DashboardGreetingPeriod {
    const hour = now.getHours();

    if (hour < 12) {
        return 'morning';
    }

    if (hour < 17) {
        return 'afternoon';
    }

    return 'evening';
}

export function greetingKey(period: DashboardGreetingPeriod = greetingPeriod()): string {
    return `dashboard.greeting_${period}`;
}

export function mapDashboardInsights(
    insights: DashboardInsights,
    labels?: { views: string; visits: string },
    scope: DashboardScope = 'user',
    rangeDays: DashboardRangeDays = DASHBOARD_DEFAULT_RANGE
): DashboardPresentation {
    const viewsSeries = parseDailyGraph(insights.graph.views);
    const visitsSeries = parseDailyGraph(insights.graph.visits);
    const viewsLabel = labels?.views ?? 'Views';
    const visitsLabel = labels?.visits ?? 'Visitors';
    const library = insights.library ?? emptyLibrary();
    const pipeline = insights.pipeline ?? emptyPipeline();
    const recentPosts = insights.recent_posts ?? [];
    const monthOverMonthViews = insights.monthOverMonthViews ?? emptyMonthOverMonth();
    const monthOverMonthVisits = insights.monthOverMonthVisits ?? emptyMonthOverMonth();
    const totalActivity = insights.views + insights.visits;
    const resolvedDays = parseDashboardRange(String(insights.days ?? rangeDays));

    return {
        cards: [
            {
                key: 'views',
                label: viewsLabel,
                value: insights.views,
                change: monthOverMonthViews,
            },
            {
                key: 'visits',
                label: visitsLabel,
                value: insights.visits,
                change: monthOverMonthVisits,
            },
        ],
        charts: [
            { key: 'views', title: viewsLabel, data: viewsSeries },
            { key: 'visits', title: visitsLabel, data: visitsSeries },
        ],
        totalActivity,
        rangeDays: resolvedDays,
        library,
        pipeline,
        recentPosts,
        topPosts: insights.top_posts ?? [],
        topReferers: insights.topReferers ?? {},
        emptyKind: dashboardEmptyKind(library),
        audienceMode: dashboardAudienceMode(library, totalActivity),
        hasPosts: libraryPostCount(library) > 0 || recentPosts.length > 0,
        monthOverMonthViews,
        monthOverMonthVisits,
        scope,
    };
}

export function isZeroActivity(presentation: DashboardPresentation): boolean {
    return presentation.totalActivity === 0;
}

export const DASHBOARD_EMPTY_STATE_KEYS = {
    no_posts: {
        headline: 'dashboard.empty_no_posts_headline',
        blurb: 'dashboard.empty_no_posts_blurb',
        cta: 'dashboard.empty_cta',
        href: '/posts/new',
    },
    drafts_only: {
        headline: 'dashboard.empty_drafts_headline',
        blurb: 'dashboard.empty_drafts_blurb',
        cta: 'dashboard.empty_drafts_cta',
        href: '/posts?type=draft',
    },
    no_traffic: {
        headline: 'dashboard.empty_headline',
        blurb: 'dashboard.empty_blurb',
        cta: 'dashboard.empty_posts_cta',
        href: '/posts',
    },
} as const;
