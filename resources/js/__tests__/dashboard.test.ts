import { describe, expect, it } from 'vitest';

import {
    DASHBOARD_DEFAULT_RANGE,
    DASHBOARD_EMPTY_STATE_KEYS,
    DASHBOARD_RANGE_DAYS,
    dashboardAudienceMode,
    dashboardEmptyKind,
    dashboardStatsParams,
    emptyLibrary,
    emptyMonthOverMonth,
    emptyPipeline,
    greetingKey,
    greetingPeriod,
    greetingSummaryParts,
    isZeroActivity,
    libraryPostCount,
    mapDashboardInsights,
    parseDashboardRange,
    parseDashboardScope,
    pipelineHasItems,
} from '@/lib/dashboard';
import type { DashboardInsights, DashboardPipelinePost, DashboardRecentPost } from '@/types/api';

const samplePost = (overrides: Partial<DashboardRecentPost> = {}): DashboardRecentPost => ({
    id: 'post-1',
    title: 'Hello',
    summary: null,
    featured_image: null,
    published_at: '2026-07-01T00:00:00.000000Z',
    created_at: '2026-07-01T00:00:00.000000Z',
    updated_at: '2026-07-02T00:00:00.000000Z',
    views_count: 12,
    ...overrides,
});

const samplePipelinePost = (overrides: Partial<DashboardPipelinePost> = {}): DashboardPipelinePost => ({
    id: 'draft-1',
    title: 'Draft one',
    published_at: null,
    updated_at: '2026-07-02T00:00:00.000000Z',
    ...overrides,
});

const sampleInsights = (overrides: Partial<DashboardInsights> = {}): DashboardInsights => ({
    views: 12,
    visits: 5,
    days: 30,
    graph: {
        views: JSON.stringify({ '2026-07-01': 4, '2026-07-02': 8 }),
        visits: JSON.stringify({ '2026-07-01': 2, '2026-07-02': 3 }),
    },
    monthOverMonthViews: { direction: 'up', percentage: '20', comparable: true },
    monthOverMonthVisits: { direction: 'down', percentage: '10', comparable: true },
    topReferers: { 'example.com': 8, Other: 4 },
    library: {
        published: 2,
        drafts: 1,
        scheduled: 0,
        pending_updates: 0,
    },
    pipeline: {
        drafts: [samplePipelinePost()],
        scheduled: [],
        pending: [],
    },
    recent_posts: [samplePost()],
    top_posts: [{ id: 'post-1', title: 'Hello', views: 12 }],
    ...overrides,
});

describe('dashboard helpers', () => {
    it('parses scope/range, maps insights, and detects zero activity', () => {
        expect(parseDashboardScope(null)).toBe('user');
        expect(parseDashboardScope('all')).toBe('all');
        expect(parseDashboardRange(null)).toBe(30);
        expect(parseDashboardRange('7')).toBe(7);
        expect(parseDashboardRange('90')).toBe(90);
        expect(parseDashboardRange('365')).toBe(365);
        expect(parseDashboardRange('14')).toBe(DASHBOARD_DEFAULT_RANGE);
        expect(DASHBOARD_RANGE_DAYS).toEqual([7, 30, 90, 365]);

        expect(dashboardStatsParams('user')).toEqual({});
        expect(dashboardStatsParams('all')).toEqual({ scope: 'all' });
        expect(dashboardStatsParams('user', 7)).toEqual({ days: 7 });
        expect(dashboardStatsParams('all', 90)).toEqual({ scope: 'all', days: 90 });
        expect(dashboardStatsParams('user', 30)).toEqual({});

        const presentation = mapDashboardInsights(
            sampleInsights(),
            {
                views: 'Views',
                visits: 'Visitors',
            },
            'user',
            30
        );

        expect(presentation.totalActivity).toBe(17);
        expect(presentation.audienceMode).toBe('active');
        expect(presentation.scope).toBe('user');
        expect(presentation.rangeDays).toBe(30);
        expect(presentation.cards).toEqual([
            {
                key: 'views',
                label: 'Views',
                value: 12,
                change: { direction: 'up', percentage: '20', comparable: true },
            },
            {
                key: 'visits',
                label: 'Visitors',
                value: 5,
                change: { direction: 'down', percentage: '10', comparable: true },
            },
        ]);
        expect(presentation.charts[0]?.data.map((point) => point.value)).toEqual([4, 8]);
        expect(presentation.hasPosts).toBe(true);
        expect(presentation.emptyKind).toBe('no_traffic');
        expect(presentation.pipeline.drafts).toHaveLength(1);
        expect(presentation.recentPosts).toHaveLength(1);
        expect(presentation.topPosts).toEqual([{ id: 'post-1', title: 'Hello', views: 12 }]);
        expect(presentation.topReferers).toEqual({ 'example.com': 8, Other: 4 });

        const empty = mapDashboardInsights(
            sampleInsights({
                views: 0,
                visits: 0,
                days: 7,
                graph: { views: '{}', visits: '{}' },
                monthOverMonthViews: emptyMonthOverMonth(),
                monthOverMonthVisits: emptyMonthOverMonth(),
                topReferers: {},
                library: emptyLibrary(),
                pipeline: emptyPipeline(),
                recent_posts: [],
                top_posts: [],
            }),
            undefined,
            'user',
            7
        );
        expect(isZeroActivity(empty)).toBe(true);
        expect(isZeroActivity(presentation)).toBe(false);
        expect(empty.emptyKind).toBe('no_posts');
        expect(empty.audienceMode).toBe('cold');
        expect(empty.rangeDays).toBe(7);
        expect(DASHBOARD_EMPTY_STATE_KEYS.no_posts.cta).toBe('dashboard.empty_cta');
    });

    it('classifies audience modes, empty kinds, and greetings', () => {
        expect(dashboardEmptyKind(emptyLibrary())).toBe('no_posts');
        expect(dashboardEmptyKind({ published: 0, drafts: 2, scheduled: 1, pending_updates: 0 })).toBe('drafts_only');
        expect(dashboardEmptyKind({ published: 3, drafts: 0, scheduled: 0, pending_updates: 1 })).toBe('no_traffic');
        expect(libraryPostCount({ published: 1, drafts: 2, scheduled: 3, pending_updates: 4 })).toBe(6);

        expect(dashboardAudienceMode(emptyLibrary(), 0)).toBe('cold');
        expect(dashboardAudienceMode({ published: 0, drafts: 1, scheduled: 0, pending_updates: 0 }, 0)).toBe(
            'drafts_only'
        );
        expect(dashboardAudienceMode({ published: 2, drafts: 0, scheduled: 0, pending_updates: 0 }, 0)).toBe(
            'waiting_readers'
        );
        expect(dashboardAudienceMode({ published: 2, drafts: 0, scheduled: 0, pending_updates: 0 }, 12)).toBe('active');

        expect(greetingPeriod(new Date('2026-07-20T09:00:00'))).toBe('morning');
        expect(greetingPeriod(new Date('2026-07-20T14:00:00'))).toBe('afternoon');
        expect(greetingPeriod(new Date('2026-07-20T20:00:00'))).toBe('evening');
        expect(greetingKey('morning')).toBe('dashboard.greeting_morning');
        expect(greetingSummaryParts(1, 627, 30)).toEqual({
            draftKey: 'dashboard.greeting_drafts_one',
            viewsKey: 'dashboard.greeting_views_other',
            periodKey: 'dashboard.greeting_period_30',
            drafts: 1,
            views: 627,
        });
        expect(greetingSummaryParts(0, 1, 90)).toEqual({
            draftKey: 'dashboard.greeting_drafts_other',
            viewsKey: 'dashboard.greeting_views_one',
            periodKey: 'dashboard.greeting_period_90',
            drafts: 0,
            views: 1,
        });
        expect(emptyMonthOverMonth()).toEqual({ direction: 'down', percentage: '0', comparable: false });
    });

    it('detects whether the pipeline has concrete posts', () => {
        expect(pipelineHasItems(emptyPipeline())).toBe(false);
        expect(
            pipelineHasItems({
                drafts: [samplePipelinePost()],
                scheduled: [],
                pending: [],
            })
        ).toBe(true);
    });
});
