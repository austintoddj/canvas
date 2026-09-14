// @vitest-environment happy-dom

import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardPipeline } from '@/components/dashboard/DashboardPipeline';
import type { DashboardPipeline as Pipeline } from '@/types/api';

import { makeBoot } from './helpers/boot';
import { renderWithCanvas } from './helpers/render';

const boot = makeBoot({
    translations: {
        'dashboard.pipeline_title': 'In progress',
        'dashboard.pipeline_pending': 'Pending updates',
        'dashboard.pipeline_drafts': 'Drafts',
        'dashboard.pipeline_scheduled': 'Scheduled',
        'dashboard.pipeline_view_all': 'View all',
        'dashboard.pipeline_pending_cue': 'Has pending changes',
        'dashboard.pipeline_goes_live': 'Goes live :date',
        'dashboard.pipeline_updated': 'Updated :date',
        'dashboard.recent_edit_aria': 'Edit :title',
        'editor.untitled_post': 'Untitled',
    },
});

describe('DashboardPipeline scheduled view-all', () => {
    it('links scheduled View all to the calendar, not the drafts tab', () => {
        const pipeline: Pipeline = {
            pending: [],
            drafts: [],
            scheduled: [
                {
                    id: 'p1',
                    title: 'Soon',
                    published_at: '2026-09-01T12:00:00Z',
                    updated_at: '2026-08-01T12:00:00Z',
                },
            ],
        };

        // totals.scheduled > listed length so View all renders
        renderWithCanvas(
            <DashboardPipeline pipeline={pipeline} scope="user" totals={{ drafts: 0, scheduled: 3, pending: 0 }} />,
            { boot }
        );

        const link = screen.getByRole('link', { name: 'View all' });
        expect(link).toHaveAttribute('href', '/calendar');
        expect(link.getAttribute('href')).not.toContain('type=draft');
    });

    it('preserves scope=all on the calendar link', () => {
        const pipeline: Pipeline = {
            pending: [],
            drafts: [],
            scheduled: [
                {
                    id: 'p1',
                    title: 'Soon',
                    published_at: '2026-09-01T12:00:00Z',
                    updated_at: '2026-08-01T12:00:00Z',
                },
            ],
        };

        renderWithCanvas(
            <DashboardPipeline pipeline={pipeline} scope="all" totals={{ drafts: 0, scheduled: 2, pending: 0 }} />,
            { boot }
        );

        expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/calendar?scope=all');
    });
});
