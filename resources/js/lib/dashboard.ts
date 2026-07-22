import { parseDailyGraph, type DailyDataPoint } from '@/lib/analytics';
import type {
    DashboardInsights,
    DashboardLibrary,
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

export type DashboardPulseItem = {
    key: keyof DashboardLibrary;
    value: number;
    href: string;
};

export type DashboardNextActionKind = 'write' | 'continue_draft' | 'review_pending' | 'view_scheduled';

export type DashboardNextAction = {
    kind: DashboardNextActionKind;
    href: string;
    titleKey: string;
    blurbKey: string;
    ctaKey: string;
};

export type DashboardGreetingPeriod = 'morning' | 'afternoon' | 'evening';

export type DashboardPresentation = {
    cards: DashboardStatCard[];
    charts: DashboardChart[];
    totalActivity: number;
    library: DashboardLibrary;
    recentPosts: DashboardRecentPost[];
    topPosts: DashboardTopPost[];
    topReferers: Record<string, number>;
    emptyKind: DashboardEmptyKind;
    pulse: DashboardPulseItem[];
    hasPosts: boolean;
    nextAction: DashboardNextAction | null;
    monthOverMonthViews: MonthOverMonth;
    monthOverMonthVisits: MonthOverMonth;
};

export function parseDashboardScope(value: string | null | undefined): DashboardScope {
    return value === 'all' ? 'all' : 'user';
}

export function dashboardStatsParams(scope: DashboardScope): StatsIndexParams {
    return scope === 'all' ? { scope: 'all' } : { scope: 'user' };
}

export function emptyLibrary(): DashboardLibrary {
    return {
        published: 0,
        drafts: 0,
        scheduled: 0,
        pending_updates: 0,
    };
}

export function emptyMonthOverMonth(): MonthOverMonth {
    return { direction: 'down', percentage: '0', comparable: false };
}

export function greetingSummaryParts(
    drafts: number,
    views: number
): { draftKey: string; viewsKey: string; drafts: number; views: number } {
    return {
        draftKey: drafts === 1 ? 'dashboard.greeting_drafts_one' : 'dashboard.greeting_drafts_other',
        viewsKey: views === 1 ? 'dashboard.greeting_views_one' : 'dashboard.greeting_views_other',
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

export function dashboardPulseItems(library: DashboardLibrary, scope: DashboardScope): DashboardPulseItem[] {
    const scopeQuery = scope === 'all' ? '?scope=all' : '';
    const draftQuery = scope === 'all' ? '?type=draft&scope=all' : '?type=draft';

    return [
        { key: 'published', value: library.published, href: `/posts${scopeQuery}` },
        { key: 'drafts', value: library.drafts, href: `/posts${draftQuery}` },
        { key: 'scheduled', value: library.scheduled, href: `/posts${scopeQuery}` },
        { key: 'pending_updates', value: library.pending_updates, href: `/posts${scopeQuery}` },
    ];
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

/**
 * Single primary next step. Priority: write → pending → draft → scheduled.
 * Returns null when the library is healthy published work with nothing waiting.
 */
export function resolveNextAction(
    library: DashboardLibrary,
    recentPosts: DashboardRecentPost[],
    scope: DashboardScope = 'user'
): DashboardNextAction | null {
    if (libraryPostCount(library) === 0) {
        return {
            kind: 'write',
            href: '/posts/new',
            titleKey: 'dashboard.next_write_title',
            blurbKey: 'dashboard.next_write_blurb',
            ctaKey: 'dashboard.empty_cta',
        };
    }

    if (library.pending_updates > 0) {
        const pending = recentPosts.find((post) => post.has_pending_changes);

        return {
            kind: 'review_pending',
            href: pending ? `/posts/${pending.id}` : `/posts${scope === 'all' ? '?scope=all' : ''}`,
            titleKey: 'dashboard.next_pending_title',
            blurbKey: 'dashboard.next_pending_blurb',
            ctaKey: 'dashboard.next_pending_cta',
        };
    }

    if (library.drafts > 0) {
        const draft = recentPosts.find((post) => post.published_at === null || post.published_at === '');

        return {
            kind: 'continue_draft',
            href: draft ? `/posts/${draft.id}` : `/posts?type=draft${scope === 'all' ? '&scope=all' : ''}`,
            titleKey: 'dashboard.next_draft_title',
            blurbKey: 'dashboard.next_draft_blurb',
            ctaKey: 'dashboard.next_draft_cta',
        };
    }

    if (library.scheduled > 0) {
        return {
            kind: 'view_scheduled',
            href: `/posts?type=draft${scope === 'all' ? '&scope=all' : ''}`,
            titleKey: 'dashboard.next_scheduled_title',
            blurbKey: 'dashboard.next_scheduled_blurb',
            ctaKey: 'dashboard.next_scheduled_cta',
        };
    }

    return null;
}

export function mapDashboardInsights(
    insights: DashboardInsights,
    labels?: { views: string; visits: string },
    scope: DashboardScope = 'user'
): DashboardPresentation {
    const viewsSeries = parseDailyGraph(insights.graph.views);
    const visitsSeries = parseDailyGraph(insights.graph.visits);
    const viewsLabel = labels?.views ?? 'Views (last 30 days)';
    const visitsLabel = labels?.visits ?? 'Visitors (last 30 days)';
    const library = insights.library ?? emptyLibrary();
    const recentPosts = insights.recent_posts ?? [];
    const monthOverMonthViews = insights.monthOverMonthViews ?? emptyMonthOverMonth();
    const monthOverMonthVisits = insights.monthOverMonthVisits ?? emptyMonthOverMonth();

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
        totalActivity: insights.views + insights.visits,
        library,
        recentPosts,
        topPosts: insights.top_posts ?? [],
        topReferers: insights.topReferers ?? {},
        emptyKind: dashboardEmptyKind(library),
        pulse: dashboardPulseItems(library, scope),
        hasPosts: libraryPostCount(library) > 0 || recentPosts.length > 0,
        nextAction: resolveNextAction(library, recentPosts, scope),
        monthOverMonthViews,
        monthOverMonthVisits,
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

export const DASHBOARD_PULSE_LABEL_KEYS = {
    published: 'dashboard.pulse_published',
    drafts: 'dashboard.pulse_drafts',
    scheduled: 'dashboard.pulse_scheduled',
    pending_updates: 'dashboard.pulse_pending',
} as const;
