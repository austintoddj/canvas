// @vitest-environment happy-dom

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePostAutosave } from '@/hooks/usePostAutosave';
import { postsApi } from '@/lib/api/posts';
import { ValidationError } from '@/lib/api';
import type { PostFormState } from '@/lib/posts/form';
import type { Post } from '@/types/api';

vi.mock('@/lib/api/posts', () => ({ postsApi: { store: vi.fn() } }));

const form: PostFormState = {
    title: 'English',
    slug: 'shared',
    summary: '',
    body: null,
    publishedAt: null,
    featuredImage: null,
    featuredImageCaption: null,
    meta: null,
    tags: [],
    topic: null,
    author: null,
};

const post = { id: 'post-1', title: 'English', slug: 'shared', published_at: null } as Post;

afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
});

describe('multilingual autosave', () => {
    it('sends the chosen locale and ignores a response from the previous language', async () => {
        vi.useFakeTimers();
        let resolveSave!: (post: Post) => void;
        vi.mocked(postsApi.store).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveSave = resolve;
                })
        );
        const onSaved = vi.fn();
        const { result, rerender } = renderHook(
            ({ locale }) => usePostAutosave({ postId: 'post-1', form, locale, enabled: true, onSaved }),
            { initialProps: { locale: 'en' } }
        );
        let saving!: Promise<boolean>;
        act(() => {
            saving = result.current.saveNow();
        });
        expect(postsApi.store).toHaveBeenCalledWith('post-1', expect.any(Object), undefined, 'en');
        rerender({ locale: 'ru' });
        await act(async () => {
            resolveSave(post);
            await saving;
        });
        expect(onSaved).not.toHaveBeenCalled();
    });

    it('reports a failed save so switching languages can stay on the current translation', async () => {
        vi.mocked(postsApi.store).mockRejectedValue(new ValidationError({ title: ['Invalid'] }));
        const { result } = renderHook(() => usePostAutosave({ postId: 'post-1', form, locale: 'ru', enabled: true }));
        await act(async () => {
            expect(await result.current.saveNow()).toBe(false);
        });
        expect(result.current.saveStatus).toBe('error');
    });
});

it('ignores a save response from a different post in the same language', async () => {
    // Regression: GH-1587 — publication dates from an old post must not hydrate the next post.
    vi.useFakeTimers();
    let finishSave!: (post: Post) => void;
    vi.mocked(postsApi.store).mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                finishSave = resolve;
            })
    );
    const onSaved = vi.fn();
    const { result, rerender } = renderHook(
        ({ postId }) => usePostAutosave({ postId, form, locale: 'en', enabled: true, onSaved }),
        { initialProps: { postId: 'post-1' } }
    );
    let saving!: Promise<boolean>;
    act(() => {
        saving = result.current.saveNow();
    });
    rerender({ postId: 'post-2' });
    await act(async () => {
        finishSave(post);
        await vi.advanceTimersByTimeAsync(350);
        await saving;
    });
    expect(onSaved).not.toHaveBeenCalled();
});

it('ignores a save from an earlier visit to the same language', async () => {
    // Regression: GH-1587 — returning to a locale starts a new editor session.
    vi.useFakeTimers();
    let finishSave!: (post: Post) => void;
    vi.mocked(postsApi.store).mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                finishSave = resolve;
            })
    );
    const onSaved = vi.fn();
    const { result, rerender } = renderHook(
        ({ locale }) => usePostAutosave({ postId: 'post-1', form, locale, enabled: true, onSaved }),
        { initialProps: { locale: 'en' } }
    );
    let saving!: Promise<boolean>;
    act(() => {
        saving = result.current.saveNow();
    });
    rerender({ locale: 'ru' });
    rerender({ locale: 'en' });
    await act(async () => {
        finishSave(post);
        await vi.advanceTimersByTimeAsync(350);
        await saving;
    });
    expect(onSaved).not.toHaveBeenCalled();
});
