import { describe, expect, it } from 'vitest';

import {
    DASHBOARD_EMPTY_STATE_KEYS,
    dashboardEmptyKind,
    dashboardPulseItems,
    dashboardStatsParams,
    emptyLibrary,
    emptyMonthOverMonth,
    greetingKey,
    greetingPeriod,
    greetingSummaryParts,
    isZeroActivity,
    libraryPostCount,
    mapDashboardInsights,
    parseDashboardScope,
    resolveNextAction,
} from '@/lib/dashboard';
import type { DashboardInsights, DashboardRecentPost } from '@/types/api';

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

const sampleInsights = (overrides: Partial<DashboardInsights> = {}): DashboardInsights => ({
    views: 12,
    visits: 5,
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
    recent_posts: [samplePost()],
    top_posts: [{ id: 'post-1', title: 'Hello', views: 12 }],
    ...overrides,
});

describe('dashboard helpers', () => {
    it('parses scope, maps insights, and detects zero activity', () => {
        expect(parseDashboardScope(null)).toBe('user');
        expect(parseDashboardScope('all')).toBe('all');
        expect(dashboardStatsParams('user')).toEqual({ scope: 'user' });
        expect(dashboardStatsParams('all')).toEqual({ scope: 'all' });

        const presentation = mapDashboardInsights(
            sampleInsights(),
            {
                views: 'Views (last 30 days)',
                visits: 'Visitors (last 30 days)',
            },
            'user'
        );

        expect(presentation.totalActivity).toBe(17);
        expect(presentation.cards).toEqual([
            {
                key: 'views',
                label: 'Views (last 30 days)',
                value: 12,
                change: { direction: 'up', percentage: '20', comparable: true },
            },
            {
                key: 'visits',
                label: 'Visitors (last 30 days)',
                value: 5,
                change: { direction: 'down', percentage: '10', comparable: true },
            },
        ]);
        expect(presentation.charts[0]?.data.map((point) => point.value)).toEqual([4, 8]);
        expect(presentation.hasPosts).toBe(true);
        expect(presentation.emptyKind).toBe('no_traffic');
        expect(presentation.pulse).toHaveLength(4);
        expect(presentation.recentPosts).toHaveLength(1);
        expect(presentation.topPosts).toEqual([{ id: 'post-1', title: 'Hello', views: 12 }]);
        expect(presentation.topReferers).toEqual({ 'example.com': 8, Other: 4 });
        expect(presentation.nextAction?.kind).toBe('continue_draft');

        const empty = mapDashboardInsights(
            sampleInsights({
                views: 0,
                visits: 0,
                graph: { views: '{}', visits: '{}' },
                monthOverMonthViews: emptyMonthOverMonth(),
                monthOverMonthVisits: emptyMonthOverMonth(),
                topReferers: {},
                library: emptyLibrary(),
                recent_posts: [],
                top_posts: [],
            })
        );
        expect(isZeroActivity(empty)).toBe(true);
        expect(isZeroActivity(presentation)).toBe(false);
        expect(empty.emptyKind).toBe('no_posts');
        expect(empty.nextAction?.kind).toBe('write');
        expect(DASHBOARD_EMPTY_STATE_KEYS.no_posts.cta).toBe('dashboard.empty_cta');
    });

    it('classifies empty kinds, pulse links, greetings, and next actions', () => {
        expect(dashboardEmptyKind(emptyLibrary())).toBe('no_posts');
        expect(dashboardEmptyKind({ published: 0, drafts: 2, scheduled: 1, pending_updates: 0 })).toBe('drafts_only');
        expect(dashboardEmptyKind({ published: 3, drafts: 0, scheduled: 0, pending_updates: 1 })).toBe('no_traffic');
        expect(libraryPostCount({ published: 1, drafts: 2, scheduled: 3, pending_updates: 4 })).toBe(6);

        const mine = dashboardPulseItems({ published: 1, drafts: 2, scheduled: 0, pending_updates: 0 }, 'user');
        expect(mine.find((item) => item.key === 'published')?.href).toBe('/posts');
        expect(mine.find((item) => item.key === 'drafts')?.href).toBe('/posts?type=draft');

        const all = dashboardPulseItems({ published: 1, drafts: 2, scheduled: 0, pending_updates: 0 }, 'all');
        expect(all.find((item) => item.key === 'published')?.href).toBe('/posts?scope=all');
        expect(all.find((item) => item.key === 'drafts')?.href).toBe('/posts?type=draft&scope=all');

        expect(greetingPeriod(new Date('2026-07-20T09:00:00'))).toBe('morning');
        expect(greetingPeriod(new Date('2026-07-20T14:00:00'))).toBe('afternoon');
        expect(greetingPeriod(new Date('2026-07-20T20:00:00'))).toBe('evening');
        expect(greetingKey('morning')).toBe('dashboard.greeting_morning');
        expect(greetingSummaryParts(1, 627)).toEqual({
            draftKey: 'dashboard.greeting_drafts_one',
            viewsKey: 'dashboard.greeting_views_other',
            drafts: 1,
            views: 627,
        });
        expect(greetingSummaryParts(2, 1)).toEqual({
            draftKey: 'dashboard.greeting_drafts_other',
            viewsKey: 'dashboard.greeting_views_one',
            drafts: 2,
            views: 1,
        });
        expect(emptyMonthOverMonth()).toEqual({ direction: 'down', percentage: '0', comparable: false });

        expect(resolveNextAction(emptyLibrary(), [])?.kind).toBe('write');
        expect(
            resolveNextAction({ published: 1, drafts: 0, scheduled: 0, pending_updates: 2 }, [
                samplePost({ has_pending_changes: true, id: 'pending-1' }),
            ])
        ).toMatchObject({ kind: 'review_pending', href: '/posts/pending-1' });
        expect(
            resolveNextAction({ published: 0, drafts: 1, scheduled: 0, pending_updates: 0 }, [
                samplePost({ id: 'draft-1', published_at: null }),
            ])
        ).toMatchObject({ kind: 'continue_draft', href: '/posts/draft-1' });
        expect(resolveNextAction({ published: 0, drafts: 0, scheduled: 2, pending_updates: 0 }, [])).toMatchObject({
            kind: 'view_scheduled',
        });
        expect(
            resolveNextAction({ published: 3, drafts: 0, scheduled: 0, pending_updates: 0 }, [samplePost()])
        ).toBeNull();
    });
});
