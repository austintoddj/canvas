// @vitest-environment happy-dom

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MobilePageActionProvider } from '@/contexts/MobilePageActionContext';
import PostsIndex from '@/pages/Posts/Index';
import { makeBoot } from '@/__tests__/helpers/boot';
import { renderWithCanvas } from '@/__tests__/helpers/render';
import type { PostListItem, PostsIndexResponse } from '@/types/api';

const indexMock = vi.fn();

vi.mock('@/lib/api/posts', () => ({
    postsApi: {
        index: (...args: unknown[]) => indexMock(...args),
        destroy: vi.fn(),
    },
}));

const translations = {
    'posts.title': 'Posts',
    'posts.type_published': 'Published',
    'posts.type_draft': 'Drafts',
    'posts.scheduled_badge': 'Scheduled',
    'posts.draft_badge': 'Draft',
    'posts.description': 'All your drafts and published posts.',
    'posts.scope_mine': 'Mine',
    'posts.scope_all': 'All',
    'posts.view_calendar': 'View calendar',
    'posts.search_label': 'Search posts',
    'posts.sort_label': 'Sort',
    'posts.sort_activity_newest': 'Recent activity',
    'posts.sort_activity_oldest': 'Oldest activity',
    'posts.sort_published_newest': 'Newest published',
    'posts.sort_published_oldest': 'Oldest published',
    'posts.sort_created_newest': 'Newest created',
    'posts.sort_created_oldest': 'Oldest created',
    'posts.filtered_empty': 'No posts match your search.',
    'posts.empty_published_headline': 'No published posts',
    'posts.empty_published_blurb': 'Publish a post and it will show up here.',
    'posts.empty_drafts_headline': 'No drafts',
    'posts.empty_drafts_blurb': 'Drafts you are writing show up here.',
    'posts.empty_cta': 'New post',
    'posts.new': 'New post',
    'posts.load_error': 'Unable to load posts.',
    'dashboard.pending_badge': 'Pending edits',
    'common.edit_aria': 'Edit :name',
    'common.delete_aria': 'Delete :name',
    'common.delete': 'Delete',
    'editor.stats': 'Stats',
    'dashboard.recent_stats_aria': 'View stats for :title',
    'editor.untitled_post': 'Untitled',
};

function post(overrides: Partial<PostListItem> = {}): PostListItem {
    return {
        id: 'post-1',
        title: 'Hello',
        summary: 'A summary',
        featured_image: null,
        published_at: '2020-01-15T12:00:00Z',
        created_at: '2020-01-15T12:00:00Z',
        updated_at: '2020-01-15T12:00:00Z',
        views_count: 12,
        ...overrides,
    };
}

function payload(items: PostListItem[]): PostsIndexResponse {
    return {
        posts: {
            data: items,
            current_page: 1,
            last_page: 1,
            per_page: 12,
            total: items.length,
            from: 1,
            to: items.length,
            first_page_url: '/posts',
            last_page_url: '/posts',
            next_page_url: null,
            prev_page_url: null,
            path: '/posts',
            links: [],
        },
        draftCount: 1,
        publishedCount: 2,
    };
}

beforeEach(() => {
    indexMock.mockReset();
});

describe('Posts list rows', () => {
    it('hides the Published badge, keeps scheduled and pending badges, and leaves the phone date', async () => {
        indexMock.mockResolvedValue(
            payload([
                post({ id: 'live', title: 'Live', summary: '' }),
                post({
                    id: 'pending',
                    title: 'Needs update',
                    has_pending_changes: true,
                }),
                post({
                    id: 'later',
                    title: 'Later',
                    published_at: '2099-06-01T12:00:00Z',
                    updated_at: '2099-06-01T12:00:00Z',
                }),
            ])
        );

        renderWithCanvas(
            <MobilePageActionProvider>
                <PostsIndex />
            </MobilePageActionProvider>,
            { boot: makeBoot({ translations }), path: '/posts' }
        );

        await waitFor(() => {
            expect(document.querySelectorAll('[data-publish-status]')).toHaveLength(1);
        });

        expect(document.querySelector('[data-publish-status="published"]')).toBeNull();
        expect(document.querySelector('[data-publish-status="scheduled"]')).toHaveTextContent('Scheduled');
        expect(document.querySelectorAll('[data-pending-changes="true"]')).toHaveLength(1);

        const liveRow = screenRow('Live');
        expect(liveRow?.className).not.toContain('even:bg-zinc-950/2.5');
        expect(liveRow?.className).toContain('focus-visible:-outline-offset-2');
        const liveSubtitle = liveRow?.querySelector('[data-slot="text"]');
        expect(liveSubtitle?.className).toContain('sm:hidden');
        expect(liveSubtitle?.textContent).toBe('15/01/20');
        expect(liveRow?.textContent).not.toMatch(/views/i);
        expect(liveRow?.querySelector('svg')?.getAttribute('class')).toContain('size-4');
        expect(liveRow?.querySelector('button')?.className).toContain('size-10');

        const pendingSubtitle = screenRow('Needs update')?.querySelector('[data-slot="text"]');
        expect(pendingSubtitle?.textContent).toBe('15/01/20 · A summary');
        expect(pendingSubtitle?.querySelector('.sm\\:hidden')?.textContent).toBe('15/01/20 · ');
    });

    it('shows Draft and Scheduled badges on the drafts tab', async () => {
        indexMock.mockResolvedValue(
            payload([
                post({ id: 'draft', title: 'Scratch', published_at: null, summary: 'Notes' }),
                post({
                    id: 'queued',
                    title: 'Queued',
                    published_at: '2099-06-01T12:00:00Z',
                    summary: 'Soon',
                }),
            ])
        );

        renderWithCanvas(
            <MobilePageActionProvider>
                <PostsIndex />
            </MobilePageActionProvider>,
            { boot: makeBoot({ translations }), path: '/posts?type=draft' }
        );

        await waitFor(() => {
            expect(document.querySelector('[data-publish-status="draft"]')).toHaveTextContent('Draft');
        });
        expect(document.querySelector('[data-publish-status="scheduled"]')).toHaveTextContent('Scheduled');
        expect(document.querySelector('[data-publish-status="published"]')).toBeNull();
    });

    it('puts search on its own row below sm and gives the calendar link a 44px target', async () => {
        indexMock.mockResolvedValue(payload([post({ id: 'draft', title: 'Scratch', published_at: null })]));

        renderWithCanvas(
            <MobilePageActionProvider>
                <PostsIndex />
            </MobilePageActionProvider>,
            { boot: makeBoot({ translations }), path: '/posts?type=draft' }
        );

        const search = await screen.findByRole('searchbox', { name: 'Search posts' });
        const pill = search.parentElement;
        const pillClasses = pill?.className.split(/\s+/) ?? [];
        expect(pillClasses).toContain('h-9');
        expect(pillClasses).toContain('sm:h-8');
        expect(pillClasses).toContain('focus-within:ring-2');
        expect(search.className.split(/\s+/)).toContain('text-base/6');

        const filters = document.querySelector('[data-posts-list-filters]');
        const filterClasses = filters?.className.split(/\s+/) ?? [];
        expect(filterClasses).toContain('flex-col');
        expect(filterClasses).toContain('sm:flex-row');
        expect(filterClasses).toContain('sm:flex-wrap');
        expect(search.closest('[data-posts-list-filters]')).toBe(filters);

        const link = screen.getByRole('link', { name: 'View calendar' });
        const linkClasses = link.className.split(/\s+/);
        expect(linkClasses).toContain('min-h-11');
        expect(linkClasses).toContain('px-2');
        expect(filters?.contains(link)).toBe(true);
    });

    it('requests the selected sort and resets to the first page', async () => {
        const user = userEvent.setup();
        indexMock.mockResolvedValue(payload([post({ id: 'live', title: 'Hello' })]));

        renderWithCanvas(
            <MobilePageActionProvider>
                <PostsIndex />
            </MobilePageActionProvider>,
            { boot: makeBoot({ translations }), path: '/posts?page=2' }
        );

        const sort = await screen.findByRole('combobox', { name: 'Sort' });
        expect(sort).toHaveValue('created');
        expect(indexMock).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }), expect.anything());

        await user.selectOptions(sort, 'published');

        await waitFor(() => {
            expect(indexMock).toHaveBeenCalledWith({ sort: 'published' }, expect.anything());
        });
    });
});

function screenRow(title: string): HTMLElement | null {
    return [...document.querySelectorAll('tr')].find((row) => row.textContent?.includes(title)) ?? null;
}
