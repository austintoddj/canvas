// @vitest-environment happy-dom

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import PostPublishDialog from '@/components/posts/PostPublishDialog';
import type { PostFormState } from '@/lib/posts/form';

import { canvasTree, renderWithCanvas } from './helpers/render';

function form(overrides: Partial<PostFormState> = {}): PostFormState {
    return {
        title: 'Ship it',
        slug: 'ship-it',
        summary: '',
        body: '<p>Body</p>',
        publishedAt: null,
        featuredImage: null,
        featuredImageCaption: null,
        meta: null,
        tags: [],
        topic: null,
        author: null,
        ...overrides,
    };
}

describe('PostPublishDialog', () => {
    it('blocks publish without a title and enables it when titled', async () => {
        const user = userEvent.setup();
        const onPublishNow = vi.fn();

        const { rerender } = renderWithCanvas(
            <PostPublishDialog
                open
                form={form({ title: '' })}
                onClose={vi.fn()}
                onPublishNow={onPublishNow}
                onSchedule={vi.fn()}
            />
        );

        expect(screen.getByText('Add a title before publishing.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();

        rerender(
            canvasTree(
                <PostPublishDialog
                    open
                    form={form({ title: 'Ship it' })}
                    onClose={vi.fn()}
                    onPublishNow={onPublishNow}
                    onSchedule={vi.fn()}
                />
            )
        );

        const publish = screen.getByRole('button', { name: 'Publish' });
        expect(publish).toBeEnabled();
        await user.click(publish);
        expect(onPublishNow).toHaveBeenCalledTimes(1);
    });

    it('switches to schedule mode and requires a future datetime', async () => {
        const user = userEvent.setup();
        const onSchedule = vi.fn();

        renderWithCanvas(
            <PostPublishDialog open form={form()} onClose={vi.fn()} onPublishNow={vi.fn()} onSchedule={onSchedule} />
        );

        expect(screen.getByRole('heading', { name: 'Publish' })).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Publish' }).className).not.toMatch(/emerald|text-2xl|sr-only/);
        expect(screen.getByText('Choose when readers should see it.')).toBeInTheDocument();
        expect(screen.queryByText('Looks good to me.')).not.toBeInTheDocument();

        const timing = screen.getByRole('radiogroup', { name: 'When to publish' });
        expect(timing.className).toContain('grid-cols-1');
        expect(timing.className).toContain('sm:grid-flow-col');
        expect(screen.getByRole('radio', { name: 'Publish now' }).className).toContain('min-h-11');

        const actions = screen.getByRole('button', { name: 'Publish' }).parentElement;
        expect(actions?.className).toContain('flex-col-reverse');

        await user.click(screen.getByRole('radio', { name: 'Schedule for later' }));
        expect(screen.getByRole('heading', { name: 'Schedule' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Schedule' })).toBeInTheDocument();
        // Seeded schedule is in the future by default — primary action should be enabled.
        expect(screen.getByRole('button', { name: 'Schedule' })).toBeEnabled();
    });

    it('does not close while busy', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        renderWithCanvas(
            <PostPublishDialog open form={form()} busy onClose={onClose} onPublishNow={vi.fn()} onSchedule={vi.fn()} />
        );

        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: 'Close' }));
        expect(onClose).not.toHaveBeenCalled();
    });
});
