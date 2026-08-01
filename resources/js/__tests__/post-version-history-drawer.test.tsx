// @vitest-environment happy-dom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PostVersionHistoryDrawer from '@/components/posts/PostVersionHistoryDrawer';
import { CanvasContext, type CanvasContextValue } from '@/contexts/CanvasContext';
import { createTranslator } from '@/lib/i18n';
import type { PostRevision, PostRevisionListItem } from '@/types/api';

const revisionsMock = vi.fn();
const revisionMock = vi.fn();
const restoreMock = vi.fn();
const renameMock = vi.fn();

vi.mock('@/lib/api/posts', () => ({
    postsApi: {
        revisions: (...args: unknown[]) => revisionsMock(...args),
        revision: (...args: unknown[]) => revisionMock(...args),
        createRevision: vi.fn(),
        restoreRevision: (...args: unknown[]) => restoreMock(...args),
        renameRevision: (...args: unknown[]) => renameMock(...args),
    },
}));

vi.mock('@/lib/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const dictionary = {
    'editor.history_title': 'Version history',
    'editor.history_load_error': 'Unable to load version history.',
    'editor.history_retry': 'Try again',
    'editor.history_empty_title': 'No versions yet',
    'editor.history_empty_blurb': 'Versions are saved when you publish, update, or leave the editor.',
    'editor.history_filter_label': 'Filter versions',
    'editor.history_filter_all': 'All versions',
    'editor.history_filter_named': 'Named versions',
    'editor.history_current_version': 'Current version',
    'editor.history_matches_editor': 'This matches what’s in the editor.',
    'editor.history_this_version': 'This version',
    'editor.history_named_empty_title': 'No named versions',
    'editor.history_named_empty_blurb': 'Rename a version to pin a label, then filter here.',
    'editor.history_changes': 'Compare versions',
    'editor.history_restore': 'Restore',
    'editor.history_rename': 'Rename',
    'editor.history_rename_title': 'Rename version',
    'editor.history_rename_help': 'Named versions show up under the Named filter so you can find them quickly.',
    'editor.history_rename_placeholder': 'Version name',
    'editor.history_renamed': 'Version renamed.',
    'editor.history_rename_error': 'Unable to rename this version.',
    'editor.history_restored': 'Version restored.',
    'editor.history_restored_pending': 'Restored as pending edits — Update to publish.',
    'editor.history_restore_error': 'Unable to restore this version.',
    'editor.history_body': 'Body',
    'editor.history_no_title_changes': 'No title changes',
    'editor.history_no_body_changes': 'No body changes',
    'editor.history_today': 'Today',
    'editor.history_yesterday': 'Yesterday',
    'editor.history_last_week': 'Last week',
    'editor.title_label': 'Title',
    'common.close': 'Close',
    'common.loading': 'Loading…',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
};

function listItem(
    overrides: Partial<PostRevisionListItem> & Pick<PostRevisionListItem, 'id' | 'created_at'>
): PostRevisionListItem {
    return {
        post_id: 'post-1',
        user_id: 1,
        label: null,
        reason: null,
        title: 'Title',
        updated_at: overrides.created_at,
        user: { id: 1, name: 'Admin', username: 'admin', avatar_url: null },
        ...overrides,
    };
}

function fullRevision(overrides: Partial<PostRevision> & Pick<PostRevision, 'id' | 'created_at'>): PostRevision {
    return {
        post_id: 'post-1',
        user_id: 1,
        label: null,
        reason: null,
        title: 'Title',
        slug: 'title',
        summary: null,
        body: 'Body text',
        featured_image: null,
        featured_image_caption: null,
        meta: null,
        updated_at: overrides.created_at,
        user: { id: 1, name: 'Admin', username: 'admin', avatar_url: null },
        ...overrides,
    };
}

function renderDrawer(props: Partial<React.ComponentProps<typeof PostVersionHistoryDrawer>> = {}) {
    const translator = createTranslator(dictionary);
    const value = {
        t: translator.t,
        user: {
            id: 1,
            name: 'Admin',
            email: 'a@example.com',
            avatar_url: null,
            dark_mode: false,
            locale: 'en',
            canvas: null,
        },
    } as unknown as CanvasContextValue;

    return render(
        <CanvasContext.Provider value={value}>
            <PostVersionHistoryDrawer
                open
                onClose={() => undefined}
                postId="post-1"
                currentTitle="Current title"
                currentBody="Current body"
                onRestored={() => undefined}
                {...props}
            />
        </CanvasContext.Provider>
    );
}

beforeEach(() => {
    revisionsMock.mockReset();
    revisionMock.mockReset();
    restoreMock.mockReset();
    renameMock.mockReset();
});

afterEach(() => {
    cleanup();
});

describe('PostVersionHistoryDrawer', () => {
    it('renders period blocks with plain rows (no row menus)', async () => {
        const today = new Date();
        today.setHours(15, 0, 0, 0);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(12, 0, 0, 0);

        revisionsMock.mockResolvedValue({
            revisions: [
                listItem({ id: 'r1', created_at: today.toISOString() }),
                listItem({ id: 'r2', created_at: yesterday.toISOString() }),
            ],
        });

        renderDrawer();

        await waitFor(() => {
            expect(document.querySelector('[data-version-history-list="true"]')).not.toBeNull();
        });

        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('Yesterday')).toBeInTheDocument();
        expect(document.querySelector('[data-revision-menu-trigger]')).toBeNull();
        expect(document.querySelector('[data-revision-day-toggle]')).toBeNull();
        expect(screen.queryByText('Latest')).toBeNull();
        expect(screen.queryByText('Current version')).toBeNull();
    });

    it('opens the diff modal with rename and restore actions', async () => {
        const user = userEvent.setup();
        const older = new Date();
        older.setDate(older.getDate() - 3);
        older.setHours(9, 0, 0, 0);

        revisionsMock.mockResolvedValue({
            revisions: [listItem({ id: 'r1', created_at: older.toISOString(), title: 'Old title' })],
        });
        revisionMock.mockResolvedValue({
            revision: fullRevision({
                id: 'r1',
                created_at: older.toISOString(),
                title: 'Old title',
                body: 'Old body text',
            }),
        });

        renderDrawer({ currentTitle: 'New title', currentBody: 'New body text' });

        await waitFor(() => {
            expect(document.querySelector('[data-revision-select="true"]')).not.toBeNull();
        });

        await user.click(document.querySelector('[data-revision-select="true"]') as HTMLElement);

        await waitFor(() => {
            expect(document.querySelector('[data-version-history-diff="true"]')).not.toBeNull();
            expect(document.querySelector('[data-revision-rename-trigger="true"]')).not.toBeNull();
            expect(document.querySelector('[data-revision-restore-primary="true"]')).not.toBeNull();
        });

        expect(screen.getByText('Current version')).toBeInTheDocument();
        expect(screen.getByText('Compare versions')).toBeInTheDocument();
        expect(document.querySelector('[data-revision-diff-stats="true"]')).not.toBeNull();
        expect(document.querySelector('[data-revision-restore-primary="true"]')).not.toBeDisabled();
    });

    it('renames a revision from a dedicated rename dialog', async () => {
        const user = userEvent.setup();
        const created = new Date();
        created.setHours(10, 0, 0, 0);

        revisionsMock.mockResolvedValue({
            revisions: [listItem({ id: 'r1', created_at: created.toISOString(), label: null })],
        });
        revisionMock.mockResolvedValue({
            revision: fullRevision({
                id: 'r1',
                created_at: created.toISOString(),
                title: 'Same',
                body: 'Same body',
                label: null,
            }),
        });
        renameMock.mockResolvedValue({
            revision: listItem({ id: 'r1', created_at: created.toISOString(), label: 'Launch plan' }),
        });

        renderDrawer({ currentTitle: 'Same', currentBody: 'Same body' });

        await waitFor(() => {
            expect(document.querySelector('[data-revision-select="true"]')).not.toBeNull();
        });

        await user.click(document.querySelector('[data-revision-select="true"]') as HTMLElement);

        await waitFor(() => {
            expect(document.querySelector('[data-revision-rename-trigger="true"]')).not.toBeNull();
        });

        await user.click(document.querySelector('[data-revision-rename-trigger="true"]') as HTMLElement);

        await waitFor(() => {
            expect(screen.getByText('Rename version')).toBeInTheDocument();
            expect(document.querySelector('[data-revision-rename-input="true"]')).not.toBeNull();
        });

        const input = document.querySelector('[data-revision-rename-input="true"]') as HTMLInputElement;
        await user.clear(input);
        await user.type(input, 'Launch plan');
        await user.click(document.querySelector('[data-revision-rename-save="true"]') as HTMLElement);

        await waitFor(() => {
            expect(renameMock).toHaveBeenCalledWith('post-1', 'r1', { label: 'Launch plan' });
            expect(document.querySelector('[data-revision-renaming="true"]')).toBeNull();
        });

        // List row primary text should switch to the new name.
        await waitFor(() => {
            const row = document.querySelector('[data-revision-row="r1"]');
            expect(row?.textContent).toContain('Launch plan');
        });
    });

    it('shows the revision content when it matches the editor', async () => {
        const user = userEvent.setup();
        const created = new Date();
        created.setHours(10, 0, 0, 0);

        revisionsMock.mockResolvedValue({
            revisions: [listItem({ id: 'r1', created_at: created.toISOString(), title: 'Same title' })],
        });
        revisionMock.mockResolvedValue({
            revision: fullRevision({
                id: 'r1',
                created_at: created.toISOString(),
                title: 'Same title',
                body: '<p>Same body content</p>',
            }),
        });

        renderDrawer({ currentTitle: 'Same title', currentBody: '<p>Same body content</p>' });

        await waitFor(() => {
            expect(document.querySelector('[data-revision-select="true"]')).not.toBeNull();
        });

        await user.click(document.querySelector('[data-revision-select="true"]') as HTMLElement);

        await waitFor(() => {
            expect(document.querySelector('[data-revision-snapshot="true"]')).not.toBeNull();
            expect(document.querySelector('[data-revision-diff-matches="true"]')).not.toBeNull();
        });

        expect(screen.getByText('This matches what’s in the editor.')).toBeInTheDocument();
        expect(screen.getByText('Same title')).toBeInTheDocument();
        expect(screen.getByText('Same body content')).toBeInTheDocument();
        expect(document.querySelector('[data-revision-restore-primary="true"]')).toBeDisabled();
        expect(document.querySelector('[data-revision-diff-side]')).toBeNull();
    });

    it('filters to named versions when the named pill is selected', async () => {
        const user = userEvent.setup();
        const created = new Date().toISOString();

        revisionsMock.mockResolvedValue({
            revisions: [
                listItem({ id: 'r1', created_at: created, label: 'Launch plan' }),
                listItem({ id: 'r2', created_at: created, label: null }),
            ],
        });

        renderDrawer();

        await waitFor(() => {
            expect(document.querySelectorAll('[data-revision-row]').length).toBe(2);
        });

        await user.click(screen.getByRole('radio', { name: 'Named versions' }));

        await waitFor(() => {
            expect(document.querySelectorAll('[data-revision-row]').length).toBe(1);
            expect(document.querySelector('[data-revision-row="r1"]')).not.toBeNull();
            expect(screen.getByText('Launch plan')).toBeInTheDocument();
        });
    });
});
