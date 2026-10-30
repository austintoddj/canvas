// @vitest-environment happy-dom

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { MobilePageActionProvider } from '@/contexts/MobilePageActionContext';
import PostsIndex from '@/pages/Posts/Index';
import type { PostsIndexResponse } from '@/types/api';

import { makeBoot } from './helpers/boot';
import { matchMediaReducedMotion, stubMatchMedia } from './helpers/dom';
import { renderWithCanvas } from './helpers/render';

const indexMock = vi.fn();

vi.mock('@/lib/api/posts', () => ({
    postsApi: {
        index: (...args: unknown[]) => indexMock(...args),
    },
}));

beforeAll(() => {
    stubMatchMedia(matchMediaReducedMotion);
});

const boot = makeBoot({
    translations: {
        'posts.title': 'Posts',
        'posts.description': 'All your drafts and published posts.',
        'posts.new': 'New post',
        'posts.type_label': 'Post type',
        'posts.type_published': 'Published',
        'posts.type_drafts': 'Drafts',
        'posts.sort_label': 'Sort posts',
        'posts.sort_created': 'Created',
        'posts.sort_published': 'Published',
        'posts.sort_updated': 'Updated',
        'posts.sort_newest': 'Newest first',
        'posts.sort_oldest': 'Oldest first',
        'posts.empty_published_headline': 'No published posts yet',
        'posts.empty_published_blurb': 'Nothing published yet.',
        'posts.empty_drafts_headline': 'No drafts yet',
        'posts.empty_drafts_blurb': 'Drafts stay private until you publish them.',
        'posts.empty_cta': 'New post',
        'posts.load_error': 'Unable to load posts.',
        'common.next_page': 'Next page',
        'common.previous_page': 'Previous page',
        'common.page_navigation': 'Page navigation',
    },
});

function listResponse(): PostsIndexResponse {
    return {
        draftCount: 0,
        publishedCount: 2,
        posts: {
            data: [
                {
                    id: 'post-a',
                    title: 'Alpha',
                    summary: 'First',
                    featured_image: null,
                    published_at: '2026-06-01T00:00:00.000Z',
                    created_at: '2026-05-01T00:00:00.000Z',
                    updated_at: '2026-06-02T00:00:00.000Z',
                    views_count: 3,
                },
                {
                    id: 'post-b',
                    title: 'Beta',
                    summary: null,
                    featured_image: null,
                    published_at: '2026-04-01T00:00:00.000Z',
                    created_at: '2026-03-01T00:00:00.000Z',
                    updated_at: '2026-04-02T00:00:00.000Z',
                    views_count: 1,
                },
            ],
            current_page: 1,
            last_page: 2,
            per_page: 10,
            total: 11,
            from: 1,
            to: 2,
            first_page_url: '/posts',
            last_page_url: '/posts?page=2',
            next_page_url: '/posts?page=2',
            prev_page_url: null,
            path: '/posts',
            links: [],
        },
    };
}

function renderPosts(path = '/posts') {
    return renderWithCanvas(
        <MobilePageActionProvider>
            <PostsIndex />
        </MobilePageActionProvider>,
        { boot, path }
    );
}

describe('PostsIndex sort', () => {
    beforeEach(() => {
        indexMock.mockReset();
        indexMock.mockResolvedValue(listResponse());
    });

    it('requests created date newest first unless the URL asks for another sort', async () => {
        renderPosts('/posts?page=2');

        await waitFor(() => {
            expect(indexMock).toHaveBeenCalledWith({ page: 2 }, expect.any(AbortSignal));
        });

        expect(screen.getByRole('combobox', { name: 'Sort posts' })).toHaveValue('created');
        expect(screen.getByRole('button', { name: 'Newest first' })).toBeInTheDocument();
    });

    it('loads each sort from the query string and keeps it on the next page', async () => {
        const sorts = ['created_oldest', 'updated', 'updated_oldest', 'published', 'published_oldest'] as const;

        for (const sort of sorts) {
            indexMock.mockClear();
            const view = renderPosts(`/posts?sort=${sort}`);

            await waitFor(() => {
                expect(indexMock).toHaveBeenCalledWith({ sort }, expect.any(AbortSignal));
            });

            const field = sort.startsWith('published')
                ? 'published'
                : sort.startsWith('updated')
                  ? 'updated'
                  : 'created';

            expect(screen.getByRole('combobox', { name: 'Sort posts' })).toHaveValue(field);
            expect(
                screen.getByRole('button', { name: sort.endsWith('_oldest') ? 'Oldest first' : 'Newest first' })
            ).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute(
                    'href',
                    `/posts?sort=${sort}&page=2`
                );
            });

            view.unmount();
        }
    });

    it('writes the chosen sort into the request and drops the page', async () => {
        const user = userEvent.setup();
        renderPosts('/posts?sort=updated&page=3');

        await waitFor(() => {
            expect(indexMock).toHaveBeenCalledWith({ sort: 'updated', page: 3 }, expect.any(AbortSignal));
        });

        await user.selectOptions(screen.getByRole('combobox', { name: 'Sort posts' }), 'published');

        await waitFor(() => {
            expect(indexMock).toHaveBeenLastCalledWith({ sort: 'published' }, expect.any(AbortSignal));
            expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute(
                'href',
                '/posts?sort=published&page=2'
            );
        });

        await user.click(screen.getByRole('button', { name: 'Newest first' }));

        await waitFor(() => {
            expect(indexMock).toHaveBeenLastCalledWith({ sort: 'published_oldest' }, expect.any(AbortSignal));
            expect(screen.getByRole('button', { name: 'Oldest first' })).toBeInTheDocument();
            expect(screen.getByRole('combobox', { name: 'Sort posts' })).toHaveValue('published');
        });
    });
});
