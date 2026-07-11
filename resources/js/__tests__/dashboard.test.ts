import { describe, expect, it } from 'vitest';

import dashboardSource from '@/pages/Dashboard.tsx?raw';
import {
    DASHBOARD_EMPTY_STATE,
    dashboardStatsParams,
    isZeroActivity,
    mapDashboardInsights,
    parseDashboardScope,
} from '@/lib/dashboard';
import type { DashboardInsights } from '@/types/api';

describe('parseDashboardScope', () => {
    it('defaults to user scope', () => {
        expect(parseDashboardScope(null)).toBe('user');
        expect(parseDashboardScope(undefined)).toBe('user');
        expect(parseDashboardScope('mine')).toBe('user');
        expect(parseDashboardScope('all')).toBe('all');
    });
});

describe('dashboardStatsParams', () => {
    it('maps scope into stats query params', () => {
        expect(dashboardStatsParams('user')).toEqual({ scope: 'user' });
        expect(dashboardStatsParams('all')).toEqual({ scope: 'all' });
    });
});

describe('mapDashboardInsights', () => {
    it('maps API insights into stat cards and chart series', () => {
        const insights: DashboardInsights = {
            views: 12,
            visits: 5,
            graph: {
                views: JSON.stringify({ '2026-07-01': 4, '2026-07-02': 8 }),
                visits: JSON.stringify({ '2026-07-01': 2, '2026-07-02': 3 }),
            },
        };

        const presentation = mapDashboardInsights(insights);

        expect(presentation.totalActivity).toBe(17);
        expect(presentation.cards).toEqual([
            { key: 'views', label: 'Views (last 30 days)', value: 12 },
            { key: 'visits', label: 'Visits (last 30 days)', value: 5 },
        ]);
        expect(presentation.charts[0]?.key).toBe('views');
        expect(presentation.charts[0]?.data).toEqual([
            { date: '2026-07-01', value: 4, label: expect.any(String) },
            { date: '2026-07-02', value: 8, label: expect.any(String) },
        ]);
        expect(presentation.charts[1]?.key).toBe('visits');
        expect(presentation.charts[1]?.data.map((point) => point.value)).toEqual([2, 3]);
    });
});

describe('isZeroActivity', () => {
    it('detects empty traffic from totalActivity', () => {
        const empty = mapDashboardInsights({
            views: 0,
            visits: 0,
            graph: { views: '{}', visits: '{}' },
        });
        const active = mapDashboardInsights({
            views: 1,
            visits: 0,
            graph: { views: JSON.stringify({ '2026-07-01': 1 }), visits: '{}' },
        });

        expect(isZeroActivity(empty)).toBe(true);
        expect(isZeroActivity(active)).toBe(false);
        expect(DASHBOARD_EMPTY_STATE.cta.toLowerCase()).toContain('post');
    });
});

describe('Dashboard page wiring', () => {
    it('fetches GET /api/stats and reuses analytics components', () => {
        expect(dashboardSource).toContain("from '@/lib/api/stats'");
        expect(dashboardSource).toContain('statsApi');
        expect(dashboardSource).toContain("from '@/components/analytics/StatCard'");
        expect(dashboardSource).toContain("from '@/components/analytics/DailyBarChart'");
        expect(dashboardSource).toContain('mapDashboardInsights');
    });

    it('shows a designed zero-activity empty state with a write CTA', () => {
        expect(dashboardSource).toContain('isZeroActivity');
        expect(dashboardSource).toContain('EmptyState');
        expect(dashboardSource).toContain('DashboardEmptyVisual');
        expect(dashboardSource).toContain('DASHBOARD_EMPTY_STATE');
        expect(dashboardSource).toContain('/posts/new');
    });
});
