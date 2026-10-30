// @vitest-environment happy-dom

import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MobilePageActionProvider } from '@/contexts/MobilePageActionContext';
import Dashboard from '@/pages/Dashboard';
import { makeBoot } from '@/__tests__/helpers/boot';
import { renderWithCanvas } from '@/__tests__/helpers/render';

const indexMock = vi.fn();

vi.mock('@/lib/api/stats', () => ({
    statsApi: {
        index: (...args: unknown[]) => indexMock(...args),
    },
}));

const translations = {
    'dashboard.title': 'Dashboard',
    'dashboard.greeting_morning': 'Good morning, :name',
    'dashboard.greeting_afternoon': 'Good afternoon, :name',
    'dashboard.greeting_evening': 'Good evening, :name',
    'dashboard.greeting_summary': ':drafts · :views',
    'dashboard.greeting_drafts_one': ':count draft waiting',
    'dashboard.greeting_drafts_other': ':count drafts waiting',
    'dashboard.greeting_views_one': ':count view :period',
    'dashboard.greeting_views_other': ':count views :period',
    'dashboard.greeting_period_30': 'in the last 30 days',
    'dashboard.views_30': 'Views',
    'dashboard.visits_30': 'Visitors',
    'dashboard.load_error': 'Unable to load dashboard stats.',
    'posts.new': 'New post',
};

beforeEach(() => {
    indexMock.mockReset();
});

describe('Dashboard subtitle', () => {
    it('shows a two-line skeleton until the summary arrives', async () => {
        let resolveStats: (value: unknown) => void = () => undefined;
        indexMock.mockReturnValue(
            new Promise((resolve) => {
                resolveStats = resolve;
            })
        );

        renderWithCanvas(
            <MobilePageActionProvider>
                <Dashboard />
            </MobilePageActionProvider>,
            { boot: makeBoot({ translations }) }
        );

        const skeleton = document.querySelector('[data-dashboard-subtitle-skeleton="true"]');
        expect(skeleton?.children).toHaveLength(2);
        expect(skeleton?.children[1]?.className.split(/\s+/)).toContain('sm:hidden');
        expect(document.body.textContent).not.toContain('Your publishing pulse');
        expect(document.querySelector('[data-slot="page-description"]')).toBeNull();

        resolveStats({
            views: 48,
            visits: 12,
            days: 30,
            graph: { views: '{}', visits: '{}' },
            monthOverMonthViews: { direction: 'up', percentage: '0', comparable: false },
            monthOverMonthVisits: { direction: 'up', percentage: '0', comparable: false },
            topReferers: {},
            library: { published: 1, drafts: 2, scheduled: 0, pending_updates: 0 },
            pipeline: { drafts: [], scheduled: [], pending: [] },
            recent_posts: [],
            top_posts: [],
        });

        await waitFor(() => {
            expect(document.querySelector('[data-slot="page-description"]')?.textContent).toMatch(/drafts waiting/);
        });
        expect(document.querySelector('[data-dashboard-subtitle-skeleton="true"]')).toBeNull();
    });
});
