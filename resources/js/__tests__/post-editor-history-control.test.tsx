// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import PostEditorLayout from '@/components/posts/PostEditorLayout';
import { CanvasContext } from '@/contexts/CanvasContext';
import type { PostFormState } from '@/lib/posts/form';
import type { PostLastRevision } from '@/types/api';
import { makeBoot, makeCanvasValue } from '@/__tests__/helpers/boot';

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

const otherTip: PostLastRevision = {
    id: 'rev-other',
    user_id: 99,
    created_at: '2026-07-17T11:37:00.000Z',
    user: {
        id: 99,
        name: 'Becky Austin',
        username: 'becky',
        avatar_url: null,
    },
};

function renderLayout(
    onOpenHistory?: () => void,
    options: { lastRevision?: PostLastRevision | null } = {}
) {
    const base = makeBoot();
    const catalog = {
        ...JSON.parse(base.translations),
        'editor.history': 'History',
        'editor.history_title': 'Version history',
        'editor.history_last_edit': 'Last edit was :time by :name',
        'editor.history_last_edit_you': 'Last edit was :time by you',
        'editor.history_last_edit_unknown': 'Last edit was :time',
        'editor.stats': 'Stats',
        'editor.view_stats': 'View stats',
        'editor.settings': 'Settings',
        'editor.post_settings': 'Post settings',
        'editor.draft_badge': 'Draft',
        'editor.scheduled_badge': 'Scheduled',
        'editor.published_badge': 'Published',
        'editor.pending_edits_badge': 'Pending edits',
        'editor.pending_edits_badge_short': 'Pending',
        'editor.back_to_posts': 'Posts',
        'editor.preview': 'Preview',
        'editor.publish': 'Publish',
        'editor.update': 'Update',
        'editor.updating': 'Updating…',
        'editor.publishing': 'Publishing…',
        'editor.untitled_post': 'Untitled post',
    };
    const value = makeCanvasValue(
        makeBoot({
            translations: JSON.stringify(catalog),
        })
    );

    return render(
        <MemoryRouter>
            <CanvasContext.Provider value={value}>
                <PostEditorLayout
                    form={form}
                    postId="post-1"
                    saveStatus="idle"
                    lastRevision={options.lastRevision ?? null}
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

    it('uses last-edit copy for the history control accessible name', () => {
        renderLayout(() => undefined, { lastRevision: otherTip });

        expect(screen.getByLabelText(/Becky Austin/)).toBeInTheDocument();
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
