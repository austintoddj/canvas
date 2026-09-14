// @vitest-environment happy-dom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
            webhookDeliveries: vi.fn().mockResolvedValue({
                data: [],
                current_page: 1,
                last_page: 1,
                per_page: 5,
                total: 0,
            }),
        },
    };
});

vi.mock('@/lib/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const boot = makeBoot({
    translations: JSON.stringify({
        'integrations.title': 'Integrations',
        'integrations.description': 'Connect Canvas to the tools you already use.',
        'integrations.configure': 'Configure',
        'integrations.enabled': 'Enabled',
        'integrations.not_enabled': 'Not enabled',
        'integrations.webhooks_status_pending': 'Pending',
        'integrations.load_error': 'Unable to load integrations.',
        'integrations.unsplash': 'Unsplash',
        'integrations.unsplash_help': 'Search free photos for featured images.',
        'integrations.unsplash_settings': 'Unsplash settings',
        'integrations.connect_unsplash': 'Connect Unsplash',
        'integrations.ai': 'AI writing',
        'integrations.ai_help': 'Rewrite and SEO tools with Grok, ChatGPT, or Claude.',
        'integrations.ai_settings': 'AI provider settings',
        'integrations.connect_ai': 'Connect AI',
        'integrations.webhooks': 'Webhooks',
        'integrations.webhooks_help':
            'Notify external services when posts are published, scheduled, updated, or deleted.',
        'integrations.webhooks_settings': 'Webhook settings',
        'integrations.webhooks_add': 'Add a webhook',
        'integrations.webhooks_logs': 'Webhook logs',
        'integrations.webhooks_view_more': 'View more',
        'integrations.webhooks_logs_event': 'Event',
        'integrations.webhooks_logs_sent_at': 'Sent at',
        'integrations.webhooks_status': 'Status',
        'integrations.webhooks_deliveries_empty': 'No deliveries yet.',
        'common.close': 'Close',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
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
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: query.includes('hover') && query.includes('pointer: fine'),
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
        });
    });

    it('renders a multi-card grid with clickable cards for each integration', async () => {
        showMock.mockResolvedValue(statusFixture());

        renderIndex();

        await waitFor(() => {
            expect(document.querySelector('[data-integrations-cards="true"]')).not.toBeNull();
        });

        const grid = document.querySelector('[data-integrations-cards="true"]');
        expect(grid?.className).toMatch(/grid/);
        expect(grid?.className).toMatch(/xl:grid-cols-4/);
        expect(grid?.className).not.toMatch(/divide-y/);

        for (const kind of ['unsplash', 'ai', 'webhooks'] as const) {
            const card = document.querySelector(`[data-integration-card="${kind}"]`);
            expect(card).not.toBeNull();
            expect(card?.tagName).toBe('BUTTON');
            expect(card?.className).toMatch(/cursor-pointer/);
        }

        expect(screen.getByText('Unsplash')).toBeInTheDocument();
        expect(screen.getByText('AI writing')).toBeInTheDocument();
        expect(screen.getByText('Webhooks')).toBeInTheDocument();

        expect(screen.getByText('Enabled')).toBeInTheDocument();
        expect(screen.getAllByText('Not enabled')).toHaveLength(2);

        expect(screen.queryByRole('link', { name: 'Configure' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Configure Unsplash' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Configure AI writing' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Configure Webhooks' })).toBeInTheDocument();

        expect(showMock).toHaveBeenCalled();
    });

    it('opens settings drawers from the integration cards without leaving the page', async () => {
        const user = userEvent.setup();
        showMock.mockResolvedValue(statusFixture());

        renderIndex();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Configure Unsplash' })).toBeInTheDocument();
        });

        expect(screen.queryByRole('dialog')).toBeNull();

        await user.click(screen.getByRole('button', { name: 'Configure Unsplash' }));

        await waitFor(() => {
            expect(screen.getByRole('dialog', { name: /Unsplash settings/i })).toBeInTheDocument();
        });
        expect(document.querySelector('[data-integration-card="unsplash"]')?.getAttribute('data-selected')).toBe(
            'true'
        );

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        await waitFor(() => {
            expect(screen.queryByRole('dialog', { name: /Unsplash settings/i })).toBeNull();
        });

        await user.click(screen.getByRole('button', { name: 'Configure AI writing' }));

        await waitFor(() => {
            expect(screen.getByRole('dialog', { name: /Connect AI/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        await waitFor(() => {
            expect(screen.queryByRole('dialog', { name: /Connect AI/i })).toBeNull();
        });

        await user.click(screen.getByRole('button', { name: 'Configure Webhooks' }));

        await waitFor(() => {
            expect(screen.getByRole('dialog', { name: /Add a webhook/i })).toBeInTheDocument();
        });
        expect(screen.getByRole('link', { name: 'View more' })).toHaveAttribute('href', '/integrations/webhooks');
    });

    it('shows pending when webhooks have credentials but are not verified', async () => {
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
        expect(within(card as HTMLElement).getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Not enabled')).toBeInTheDocument();
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

        await waitFor(() => {
            expect(document.querySelector('[data-integrations-list-skeleton="true"]')).toBeNull();
        });
        expect(document.querySelector('[data-integrations-cards="true"]')).not.toBeNull();
    });
});
