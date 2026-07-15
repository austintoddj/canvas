import { describe, expect, it } from 'vitest';

import {
    DASHBOARD_EMPTY_STATE_KEYS,
    dashboardStatsParams,
    isZeroActivity,
    mapDashboardInsights,
    parseDashboardScope,
} from '@/lib/dashboard';
import type { DashboardInsights } from '@/types/api';

describe('dashboard helpers', () => {
    it('parses scope, maps insights, and detects zero activity', () => {
        expect(parseDashboardScope(null)).toBe('user');
        expect(parseDashboardScope('all')).toBe('all');
        expect(dashboardStatsParams('user')).toEqual({ scope: 'user' });
        expect(dashboardStatsParams('all')).toEqual({ scope: 'all' });

        const insights: DashboardInsights = {
            views: 12,
            visits: 5,
            graph: {
                views: JSON.stringify({ '2026-07-01': 4, '2026-07-02': 8 }),
                visits: JSON.stringify({ '2026-07-01': 2, '2026-07-02': 3 }),
            },
        };
        const presentation = mapDashboardInsights(insights, {
            views: 'Views (last 30 days)',
            visits: 'Visits (last 30 days)',
        });

        expect(presentation.totalActivity).toBe(17);
        expect(presentation.cards).toEqual([
            { key: 'views', label: 'Views (last 30 days)', value: 12 },
            { key: 'visits', label: 'Visits (last 30 days)', value: 5 },
        ]);
        expect(presentation.charts[0]?.data.map((point) => point.value)).toEqual([4, 8]);

        const empty = mapDashboardInsights({
            views: 0,
            visits: 0,
            graph: { views: '{}', visits: '{}' },
        });
        expect(isZeroActivity(empty)).toBe(true);
        expect(isZeroActivity(presentation)).toBe(false);
        expect(DASHBOARD_EMPTY_STATE_KEYS.cta).toBe('dashboard.empty_cta');
    });
});
