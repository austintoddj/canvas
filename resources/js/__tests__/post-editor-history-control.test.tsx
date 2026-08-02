// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import PostEditorLayout from '@/components/posts/PostEditorLayout';
import { CanvasContext } from '@/contexts/CanvasContext';
import type { PostFormState } from '@/lib/posts/form';
import { makeCanvasValue } from '@/__tests__/helpers/boot';

const form: PostFormState = {
    title: 'Draft',
    slug: 'draft',
    summary: '',
    body: '<p>Hello</p>',
    publishedAt: null,
    featuredImage: null,
    featuredImageCaption: null,
    meta: null,
    tags: [],
    topic: null,
    author: null,
};

function renderLayout(onOpenHistory?: () => void) {
    const value = makeCanvasValue();

    return render(
        <MemoryRouter>
            <CanvasContext.Provider value={value}>
                <PostEditorLayout
                    form={form}
                    postId="post-1"
                    saveStatus="idle"
                    onTitleChange={() => undefined}
                    onOpenInspector={() => undefined}
                    onOpenHistory={onOpenHistory}
                    body={<div>Body</div>}
                />
            </CanvasContext.Provider>
        </MemoryRouter>
    );
}

afterEach(() => {
    cleanup();
});

describe('PostEditorLayout history control', () => {
    it('renders the history Tabler control when onOpenHistory is provided', () => {
        renderLayout(() => undefined);

        const trigger = document.querySelector('[data-post-history-trigger="true"]');
        expect(trigger).not.toBeNull();
        expect(screen.getByLabelText('Version history')).toBeInTheDocument();
        // Tabler history icon ships an svg under the button.
        expect(trigger?.querySelector('svg')).not.toBeNull();
    });

    it('hides the history control when the post is not yet persistable', () => {
        renderLayout(undefined);

        expect(document.querySelector('[data-post-history-trigger="true"]')).toBeNull();
    });

    it('stacks editor chrome for narrow viewports (no single-row crush)', () => {
        renderLayout(() => undefined);

        const chrome = document.querySelector('[data-post-editor-chrome="true"]');
        expect(chrome).not.toBeNull();
        expect(chrome?.className).toMatch(/flex-col/);
        expect(chrome?.className).toMatch(/sm:flex-row/);
        // Back label collapses to icon-only under sm.
        const back = document.querySelector('[data-post-back-to-posts="true"]');
        expect(back?.querySelector('span.hidden.sm\\:inline') ?? back?.querySelector('span.hidden')).not.toBeNull();
    });
});
