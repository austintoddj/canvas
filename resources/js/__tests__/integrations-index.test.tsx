// @vitest-environment happy-dom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import IntegrationsIndex from '@/pages/Integrations/Index';
import type { IntegrationsStatus } from '@/lib/api/integrations';

import { makeBoot, withCanvas } from './helpers/boot';

const showMock = vi.fn();

afterEach(() => {
    cleanup();
});

vi.mock('@/lib/api/integrations', async () => {
    const actual = await vi.importActual<typeof import('@/lib/api/integrations')>('@/lib/api/integrations');

    return {
        ...actual,
        integrationsApi: {
            ...actual.integrationsApi,
            show: (...args: unknown[]) => showMock(...args),
        },
    };
});

const boot = makeBoot({
    translations: JSON.stringify({
        'integrations.title': 'Integrations',
        'integrations.description': 'Connect Canvas to the tools you already use.',
        'integrations.configure': 'Configure',
        'integrations.enabled': 'Enabled',
        'integrations.not_enabled': 'Not enabled',
        'integrations.load_error': 'Unable to load integrations.',
        'integrations.unsplash': 'Unsplash',
        'integrations.unsplash_help': 'Search free photos for featured images.',
        'integrations.ai': 'AI writing',
        'integrations.ai_help': 'Rewrite and SEO tools with Grok, ChatGPT, or Claude.',
        'integrations.webhooks': 'Webhooks',
        'integrations.webhooks_help':
            'Notify external services when posts are published, scheduled, updated, or deleted.',
    }),
});

function statusFixture(overrides: Partial<IntegrationsStatus> = {}): IntegrationsStatus {
    return {
        unsplash: { status: 'enabled', configured: true, masked_key: '••••key1', enabled_at: '2026-01-01T00:00:00Z' },
        ai: { status: 'off', configured: false, provider: null, masked_key: null, model: null, enabled_at: null },
        webhooks: {
            status: 'off',
            configured: false,
            pending: false,
            url: null,
            masked_secret: null,
            events: [],
            enabled_at: null,
            available_events: [],
        },
        ...overrides,
    };
}

function renderIndex() {
    return render(
        withCanvas(
            <MemoryRouter initialEntries={['/integrations']}>
                <IntegrationsIndex />
            </MemoryRouter>,
            boot
        )
    );
}

describe('IntegrationsIndex card layout', () => {
    beforeEach(() => {
        showMock.mockReset();
    });

    it('renders a multi-card grid with configure links for each integration', async () => {
        showMock.mockResolvedValue(statusFixture());

        renderIndex();

        await waitFor(() => {
            expect(document.querySelector('[data-integrations-cards="true"]')).not.toBeNull();
        });

        const grid = document.querySelector('[data-integrations-cards="true"]');
        expect(grid?.className).toMatch(/grid/);
        expect(grid?.className).not.toMatch(/divide-y/);

        for (const kind of ['unsplash', 'ai', 'webhooks'] as const) {
            expect(document.querySelector(`[data-integration-card="${kind}"]`)).not.toBeNull();
        }

        expect(screen.getByText('Unsplash')).toBeInTheDocument();
        expect(screen.getByText('AI writing')).toBeInTheDocument();
        expect(screen.getByText('Webhooks')).toBeInTheDocument();

        // Status labels from API fixture
        expect(screen.getByText('Enabled')).toBeInTheDocument();
        expect(screen.getAllByText('Not enabled')).toHaveLength(2);

        const links = screen.getAllByRole('link', { name: 'Configure' });
        expect(links).toHaveLength(3);
        expect(links.map((link) => link.getAttribute('href'))).toEqual([
            '/integrations/unsplash',
            '/integrations/ai',
            '/integrations/webhooks',
        ]);

        // Real page path called integrationsApi.show
        expect(showMock).toHaveBeenCalled();
    });

    it('shows not enabled when webhooks have credentials but are not verified', async () => {
        showMock.mockResolvedValue(
            statusFixture({
                webhooks: {
                    status: 'off',
                    configured: false,
                    pending: true,
                    url: 'https://example.com/hooks/canvas',
                    masked_secret: '••••abcd',
                    events: ['post.published'],
                    enabled_at: null,
                    available_events: [],
                },
            })
        );

        renderIndex();

        await waitFor(() => {
            expect(document.querySelector('[data-integration-card="webhooks"]')).not.toBeNull();
        });

        const card = document.querySelector('[data-integration-card="webhooks"]');
        expect(card?.getAttribute('data-integration-status')).toBe('off');
        expect(screen.getAllByText('Not enabled')).toHaveLength(2);
        expect(screen.queryByText('Connecting')).toBeNull();
    });

    it('shows a card-shaped loading skeleton before status resolves', () => {
        showMock.mockImplementation(() => new Promise(() => undefined));

        renderIndex();

        const skeleton = document.querySelector('[data-integrations-list-skeleton="true"]');
        expect(skeleton).not.toBeNull();
        expect(skeleton?.className).toMatch(/grid/);
        expect(skeleton?.className).not.toMatch(/divide-y/);
        expect(document.querySelector('[data-integrations-cards-skeleton="true"]')).not.toBeNull();
    });

    it('keeps load-error behavior when the status request fails', async () => {
        showMock.mockRejectedValue(new Error('network'));

        renderIndex();

        await waitFor(() => {
            expect(screen.getByText('Unable to load integrations.')).toBeInTheDocument();
        });

        // After error, loading ends and cards still render (unconfigured defaults)
        await waitFor(() => {
            expect(document.querySelector('[data-integrations-list-skeleton="true"]')).toBeNull();
        });
        expect(document.querySelector('[data-integrations-cards="true"]')).not.toBeNull();
    });
});
