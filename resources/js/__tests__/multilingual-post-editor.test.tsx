// @vitest-environment happy-dom

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { makeBoot, withCanvas } from '@/__tests__/helpers/boot';
import PostsEditor from '@/pages/Posts/Editor';
import { postsApi } from '@/lib/api/posts';
import type { Post } from '@/types/api';

vi.mock('@/lib/api/posts', () => ({ postsApi: { show: vi.fn(), store: vi.fn(), createRevision: vi.fn() } }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/posts/PostBodyEditor', () => ({ default: () => <div /> }));

const english: Post = {
    id: 'post-1',
    title: 'English article',
    slug: 'shared',
    summary: null,
    body: null,
    published_at: null,
    featured_image: null,
    featured_image_caption: null,
    user_id: 1,
    topic_id: null,
    meta: null,
    created_at: '2026-11-19T00:00:00Z',
    updated_at: '2026-11-19T00:00:00Z',
    views_count: 0,
    locale: 'en',
    default_locale: 'en',
    translation_statuses: { en: 'draft', ru: 'missing' },
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(postsApi.show).mockImplementation(async (_id, _signal, locale) => ({
        post: locale === 'ru' ? { ...english, locale: 'ru', title: null } : english,
        tags: [],
        topics: [],
    }));
    vi.mocked(postsApi.store).mockResolvedValue(english);
    vi.mocked(postsApi.createRevision).mockResolvedValue({ revision: { id: 'revision-1' } } as Awaited<
        ReturnType<typeof postsApi.createRevision>
    >);
});

function renderEditor() {
    const boot = makeBoot({
        content: { default_locale: 'en', locales: ['en', 'ru'] },
        translations: {
            'editor.content_language': 'Content language',
            'editor.title_label': 'Title',
            'editor.translation_draft': 'Draft',
            'editor.translation_missing': 'No translation',
        },
    });
    const router = createMemoryRouter([{ path: '/posts/:id', element: <PostsEditor /> }], {
        initialEntries: ['/posts/post-1'],
    });
    render(withCanvas(<RouterProvider router={router} />, boot));
    return router;
}

it('checkpoints the old language before opening an empty translation with the shared slug', async () => {
    const user = userEvent.setup();
    const router = renderEditor();
    await screen.findByDisplayValue('English article');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Content language' }), 'ru');
    await waitFor(() => expect(router.state.location.search).toBe('?locale=ru'));
    expect(postsApi.createRevision).toHaveBeenCalledWith('post-1', {}, undefined, 'en');
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue(''));
    expect(postsApi.show).toHaveBeenLastCalledWith('post-1', expect.any(AbortSignal), 'ru');
});

it('stays on the current language when saving changes fails', async () => {
    const user = userEvent.setup();
    vi.mocked(postsApi.store).mockRejectedValue(new Error('Offline'));
    const router = renderEditor();
    const title = await screen.findByDisplayValue('English article');
    await user.type(title, ' edited');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Content language' }), 'ru');
    await waitFor(() => expect(postsApi.store).toHaveBeenCalled());
    expect(router.state.location.search).toBe('');
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('English article edited');
});
