// @vitest-environment happy-dom

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import CalendarIndex from '@/pages/Calendar/Index';

import { makeBoot } from './helpers/boot';
import { matchMediaReducedMotion, stubMatchMedia } from './helpers/dom';
import { renderWithCanvas } from './helpers/render';

const postsMock = vi.fn();

vi.mock('@/lib/api/calendar', () => ({
    calendarApi: {
        posts: (...args: unknown[]) => postsMock(...args),
    },
}));

beforeAll(() => {
    stubMatchMedia(matchMediaReducedMotion);
});

const boot = makeBoot({
    translations: {
        'calendar.title': 'Calendar',
        'calendar.description': 'See what is scheduled and what has already gone live.',
        'calendar.empty_title': 'Nothing this month',
        'calendar.empty_blurb': 'Publish or schedule a post and it will show up here.',
        'calendar.load_error': 'Unable to load the calendar.',
        'calendar.more': '+:count more',
        'calendar.next_month': 'Next month',
        'calendar.no_posts_day': 'No posts on this day.',
        'calendar.prev_month': 'Previous month',
        'calendar.published': 'Published',
        'calendar.scheduled': 'Scheduled',
        'calendar.scope_all': 'All authors',
        'calendar.scope_label': 'Calendar author scope',
        'calendar.scope_mine': 'Mine',
        'calendar.today': 'Today',
        'posts.new': 'New post',
        'common.untitled': 'Untitled',
        'common.post_count': ':count post',
        'common.posts_count': ':count posts',
        'dashboard.recent_edit_aria': 'Edit :title',
        'dashboard.recent_stats_aria': 'View stats for :title',
        'editor.stats': 'Stats',
    },
});

function renderCalendar(path = '/calendar') {
    return renderWithCanvas(<CalendarIndex />, { boot, path });
}

describe('CalendarIndex', () => {
    beforeEach(() => {
        postsMock.mockReset();
        postsMock.mockResolvedValue({ posts: [] });
    });

    it('keeps the month grid when there are no posts (no marketing empty swap)', async () => {
        renderCalendar();

        await waitFor(() => {
            expect(document.querySelector('[data-calendar-grid="true"]')).not.toBeNull();
        });

        expect(document.querySelector('[data-empty-state="true"]')).toBeNull();
        expect(document.querySelector('[data-calendar-month-empty="true"]')).not.toBeNull();
        expect(screen.getByText('Nothing this month')).toBeInTheDocument();
    });

    it('pulses the today marker when Today is clicked', async () => {
        const user = userEvent.setup();
        renderCalendar();

        await waitFor(() => {
            expect(document.querySelector('[data-calendar-grid="true"]')).not.toBeNull();
        });

        expect(document.querySelector('[data-calendar-today-pulse="true"]')).toBeNull();

        await user.click(screen.getByRole('button', { name: 'Today' }));

        await waitFor(() => {
            const marker = document.querySelector('[data-calendar-today-pulse="true"]');
            expect(marker).not.toBeNull();
            expect(marker?.className).toMatch(/canvas-calendar-today-pulse/);
        });
    });

    it('changes month with arrow keys when the grid is focused', async () => {
        const user = userEvent.setup();
        renderCalendar('/calendar?month=2026-08');

        await waitFor(() => {
            expect(document.querySelector('[data-calendar-grid="true"]')).not.toBeNull();
        });

        const heading = document.querySelector('h2');
        const before = heading?.textContent ?? '';
        expect(before.length).toBeGreaterThan(0);

        const grid = document.querySelector('[data-calendar-grid="true"]') as HTMLElement;
        grid.focus();
        await user.keyboard('{ArrowRight}');

        await waitFor(() => {
            expect(document.querySelector('h2')?.textContent).not.toBe(before);
        });
    });

    it('selecting an out-of-month padding day switches month and opens the day panel', async () => {
        const user = userEvent.setup();
        postsMock.mockResolvedValue({
            posts: [
                {
                    id: 'post-sep-1',
                    title: 'September post',
                    slug: 'september-post',
                    // Trailing cell of the August 2026 Sunday-start grid is 2026-09-05.
                    published_at: '2026-09-05T15:00:00.000Z',
                    featured_image: null,
                    status: 'scheduled',
                    user: null,
                },
            ],
        });

        renderCalendar('/calendar?month=2026-08');

        await waitFor(() => {
            expect(document.querySelector('[data-calendar-day="2026-09-05"]')).not.toBeNull();
        });

        await user.click(document.querySelector('[data-calendar-day="2026-09-05"]') as HTMLElement);

        // Month advances so the day query sticks (updateSearchParams drops out-of-month days).
        await waitFor(() => {
            expect(document.querySelector('h2')?.textContent).toMatch(/September/i);
            expect(document.querySelector('[data-calendar-day-panel="true"]')).not.toBeNull();
            expect(document.querySelector('[data-calendar-post="post-sep-1"]')).not.toBeNull();
            expect(document.querySelector('[data-calendar-day="2026-09-05"]')?.getAttribute('data-selected')).toBe(
                'true'
            );
        });
    });

    it('renders selected-day posts as a listing table with stats for published posts', async () => {
        postsMock.mockResolvedValue({
            posts: [
                {
                    id: 'post-aug-6',
                    title: 'Roundup for Next Week',
                    slug: 'roundup-for-next-week',
                    published_at: new Date(2026, 7, 6, 12, 0, 0).toISOString(),
                    featured_image: 'https://example.com/cover.jpg',
                    status: 'published',
                    user: { id: 1, name: 'Todd Austin', username: 'todd', avatar_url: null },
                },
                {
                    id: 'post-aug-6-later',
                    title: 'Later Roundup',
                    slug: 'later-roundup',
                    published_at: new Date(2026, 7, 6, 18, 0, 0).toISOString(),
                    featured_image: null,
                    status: 'scheduled',
                    user: null,
                },
            ],
        });

        renderCalendar('/calendar?month=2026-08&day=2026-08-06');

        await waitFor(() => {
            expect(document.querySelector('[data-calendar-post="post-aug-6"]')).not.toBeNull();
        });

        const row = document.querySelector('[data-calendar-post="post-aug-6"]');
        expect(row?.tagName).toBe('TR');
        expect(row?.className).toMatch(/hover:bg-zinc-950\/5/);
        expect(row?.className).toMatch(/dark:hover:bg-white\/5/);
        expect(document.querySelector('[data-calendar-day-panel="true"] table')).not.toBeNull();
        expect(screen.getByText('Todd Austin')).toBeInTheDocument();
        expect(screen.getByText('Published')).toBeInTheDocument();

        const stats = screen.getByRole('link', { name: 'View stats for Roundup for Next Week' });
        expect(stats).toHaveAttribute('href', '/posts/post-aug-6/stats');
        expect(screen.queryByRole('link', { name: 'View stats for Later Roundup' })).toBeNull();
    });
});
