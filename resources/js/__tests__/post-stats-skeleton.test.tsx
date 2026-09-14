// @vitest-environment happy-dom

import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';

import PostsStats from '@/pages/Posts/Stats';
import { makeBoot } from '@/__tests__/helpers/boot';
import { renderWithCanvas } from '@/__tests__/helpers/render';

const statsMock = vi.fn();

vi.mock('@/lib/api/posts', () => ({
    postsApi: {
        stats: (...args: unknown[]) => statsMock(...args),
    },
}));

vi.mock('@/lib/redirect-home', () => ({
    redirectHomeWithError: vi.fn(),
}));

beforeEach(() => {
    statsMock.mockReset();
});

describe('PostsStats loading header', () => {
    it('does not flash the live description alone while the title is still loading', async () => {
        let resolveStats: (value: unknown) => void = () => undefined;
        statsMock.mockReturnValue(
            new Promise((resolve) => {
                resolveStats = resolve;
            })
        );

        const boot = makeBoot({
            translations: {
                'stats.title': 'Stats',
                'stats.description': 'Views and visitors for this post.',
                'stats.back_to_post': 'Back to post',
                'stats.load_error': 'Unable to load stats.',
                'stats.views_month': 'Views this month',
                'stats.visits_month': 'Visitors this month',
                'stats.all_time_views': 'All-time views',
                'stats.reading_time': 'Reading time',
                'stats.vs_last_month': 'vs last month',
                'stats.change_new_month': 'New this month',
                'stats.last_30_days': 'Last 30 days',
                'stats.no_data': 'No data',
                'stats.top_referers': 'Where readers are coming from',
                'stats.top_browsers': 'Browsers',
                'stats.popular_times': 'Popular times',
                'stats.search_list': 'Search',
                'stats.export_csv': 'Export CSV',
                'stats.close_list': 'Close',
                'stats.view_all': 'View all',
                'stats.metric_views': 'Views',
                'stats.share': 'Share',
                'editor.untitled_post': 'Untitled',
                'posts.not_found': 'Post not found',
                'stats.published_only': 'Published only',
            },
        });

        renderWithCanvas(
            <Routes>
                <Route path="/posts/:id/stats" element={<PostsStats />} />
            </Routes>,
            { boot, path: '/posts/post-1/stats' }
        );

        expect(document.querySelector('[data-post-stats-header-skeleton="true"]')).not.toBeNull();
        // Live subtitle must wait until the post title is known.
        expect(document.body.textContent).not.toContain('Views and visitors for this post.');

        resolveStats({
            post: {
                id: 'post-1',
                title: 'Welcome to Canvas',
                slug: 'welcome',
                summary: null,
                body: null,
                published_at: '2026-01-01T00:00:00.000000Z',
                featured_image: null,
                featured_image_caption: null,
                meta: null,
                created_at: '2026-01-01T00:00:00.000000Z',
                updated_at: '2026-01-01T00:00:00.000000Z',
                views_count: 1,
                user_id: 1,
                topic_id: null,
            },
            monthlyViews: 1,
            monthlyVisits: 1,
            totalViews: 1,
            readTime: '1 min read',
            monthOverMonthViews: { direction: 'up', percentage: '0', comparable: false },
            monthOverMonthVisits: { direction: 'up', percentage: '0', comparable: false },
            graph: { views: '{}', visits: '{}' },
            topReferers: {},
            topBrowsers: {},
            popularReadingTimes: {},
        });

        await waitFor(() => {
            expect(document.querySelector('[data-post-stats-header-skeleton="true"]')).toBeNull();
        });
        expect(document.body.textContent).toContain('Views and visitors for this post.');
    });
});
