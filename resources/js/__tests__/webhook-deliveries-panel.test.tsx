// @vitest-environment happy-dom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WebhookDeliveriesPanel } from '@/components/integrations/WebhookDeliveriesPanel';
import type { WebhookDelivery } from '@/lib/api/integrations';

import { makeBoot, withCanvas } from './helpers/boot';

const webhookDeliveriesMock = vi.fn();

vi.mock('@/lib/api/integrations', async () => {
    const actual = await vi.importActual<typeof import('@/lib/api/integrations')>('@/lib/api/integrations');

    return {
        ...actual,
        integrationsApi: {
            ...actual.integrationsApi,
            webhookDeliveries: (...args: unknown[]) => webhookDeliveriesMock(...args),
            retryWebhookDelivery: vi.fn(),
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
        'integrations.webhooks_deliveries': 'Recent deliveries',
        'integrations.webhooks_deliveries_help': 'Help',
        'integrations.webhooks_deliveries_refresh': 'Refresh',
        'integrations.webhooks_deliveries_empty': 'No deliveries yet.',
        'integrations.webhooks_deliveries_filtered_empty': 'No deliveries match these filters.',
        'integrations.webhooks_deliveries_load_error': 'Unable to load delivery history.',
        'integrations.webhooks_deliveries_filter_status': 'Filter by status',
        'integrations.webhooks_deliveries_filter_event': 'Filter by event',
        'integrations.webhooks_deliveries_filter_all_statuses': 'All statuses',
        'integrations.webhooks_deliveries_filter_all_events': 'All events',
        'integrations.webhooks_deliveries_status_pending': 'Pending',
        'integrations.webhooks_deliveries_status_success': 'Success',
        'integrations.webhooks_deliveries_status_failed': 'Failed',
        'integrations.webhooks_deliveries_attempts': 'Attempts: :count',
        'integrations.webhooks_event_test': 'Test',
        'common.loading': 'Loading…',
    }),
});

function delivery(partial: Partial<WebhookDelivery> = {}): WebhookDelivery {
    return {
        id: partial.id ?? 'del-1',
        event: partial.event ?? 'post.published',
        url: partial.url ?? 'https://example.com/hook',
        status: partial.status ?? 'success',
        http_status: partial.http_status ?? 200,
        attempts: partial.attempts ?? 1,
        payload: null,
        response_body: null,
        error_message: partial.error_message ?? null,
        post_id: null,
        finished_at: null,
        created_at: '2026-08-01T12:00:00Z',
        updated_at: '2026-08-01T12:00:00Z',
    };
}

afterEach(() => {
    cleanup();
});

describe('WebhookDeliveriesPanel filters', () => {
    beforeEach(() => {
        webhookDeliveriesMock.mockReset();
        webhookDeliveriesMock.mockResolvedValue({
            data: [delivery()],
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 1,
        });
    });

    it('loads deliveries and refetches when status filter changes', async () => {
        const user = userEvent.setup();

        render(
            withCanvas(
                <WebhookDeliveriesPanel open enabled eventOptions={[{ id: 'post.published', label: 'Published' }]} />,
                boot
            )
        );

        await waitFor(() => {
            expect(webhookDeliveriesMock).toHaveBeenCalled();
        });

        expect(webhookDeliveriesMock.mock.calls[0]?.[0]).toMatchObject({ page: 1 });

        const statusSelect = screen.getByLabelText('Filter by status');
        await user.selectOptions(statusSelect, 'failed');

        await waitFor(() => {
            const calls = webhookDeliveriesMock.mock.calls;
            const last = calls[calls.length - 1]?.[0];
            expect(last).toMatchObject({ page: 1, status: 'failed' });
        });
    });

    it('shows filtered empty copy when filters match nothing', async () => {
        webhookDeliveriesMock.mockResolvedValue({
            data: [],
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 0,
        });

        const user = userEvent.setup();

        render(withCanvas(<WebhookDeliveriesPanel open enabled />, boot));

        await waitFor(() => {
            expect(document.querySelector('[data-webhook-deliveries-empty="true"]')).not.toBeNull();
        });

        expect(screen.getByText('No deliveries yet.')).toBeInTheDocument();

        await user.selectOptions(screen.getByLabelText('Filter by status'), 'failed');

        await waitFor(() => {
            expect(screen.getByText('No deliveries match these filters.')).toBeInTheDocument();
        });
        expect(document.querySelector('[data-webhook-deliveries-filtered="true"]')).not.toBeNull();
    });
});
