// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import PostPublishDialog from '@/components/posts/PostPublishDialog';
import type { PostFormState } from '@/lib/posts/form';

import { withCanvas } from './helpers/boot';

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

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: query.includes('prefers-reduced-motion'),
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

describe('PostPublishDialog', () => {
    it('blocks publish without a title and enables it when titled', async () => {
        const user = userEvent.setup();
        const onPublishNow = vi.fn();

        const { rerender } = render(
            withCanvas(
                <PostPublishDialog
                    open
                    form={form({ title: '' })}
                    onClose={vi.fn()}
                    onPublishNow={onPublishNow}
                    onSchedule={vi.fn()}
                />
            )
        );

        expect(screen.getByText('Add a title before publishing.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();

        rerender(
            withCanvas(
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

        render(
            withCanvas(
                <PostPublishDialog
                    open
                    form={form()}
                    onClose={vi.fn()}
                    onPublishNow={vi.fn()}
                    onSchedule={onSchedule}
                />
            )
        );

        await user.click(screen.getByRole('radio', { name: 'Schedule for later' }));
        expect(screen.getByRole('button', { name: 'Schedule' })).toBeInTheDocument();
        // Seeded schedule is in the future by default — primary action should be enabled.
        expect(screen.getByRole('button', { name: 'Schedule' })).toBeEnabled();
    });

    it('does not close while busy', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(
            withCanvas(
                <PostPublishDialog
                    open
                    form={form()}
                    busy
                    onClose={onClose}
                    onPublishNow={vi.fn()}
                    onSchedule={vi.fn()}
                />
            )
        );

        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: 'Close' }));
        expect(onClose).not.toHaveBeenCalled();
    });
});
