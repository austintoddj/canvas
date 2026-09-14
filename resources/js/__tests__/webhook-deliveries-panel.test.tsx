// @vitest-environment happy-dom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
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
        'integrations.webhooks_logs': 'Webhook logs',
        'integrations.webhooks_logs_retention': 'Retains logs for 30 days.',
        'integrations.webhooks_logs_event': 'Event',
        'integrations.webhooks_logs_sent_at': 'Sent at',
        'integrations.webhooks_status': 'Status',
        'integrations.webhooks_url': 'Endpoint URL',
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
        'integrations.webhooks_deliveries_http': 'HTTP :status',
        'integrations.webhooks_event_test': 'Test',
        'common.loading': 'Loading…',
        'common.page_navigation': 'Page navigation',
        'common.previous_page': 'Previous page',
        'common.next_page': 'Next page',
        'common.page_number': 'Page :page',
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
        ...partial,
    };
}

function pageResult(
    data: WebhookDelivery[],
    overrides: { current_page?: number; last_page?: number; total?: number } = {}
) {
    const current_page = overrides.current_page ?? 1;
    const last_page = overrides.last_page ?? 1;

    return {
        data,
        current_page,
        last_page,
        per_page: 15,
        total: overrides.total ?? data.length,
    };
}

afterEach(() => {
    cleanup();
});

describe('WebhookDeliveriesPanel', () => {
    beforeEach(() => {
        webhookDeliveriesMock.mockReset();
        webhookDeliveriesMock.mockResolvedValue(pageResult([delivery()]));
    });

    it('loads deliveries into a table without an accordion', async () => {
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

        expect(screen.getByRole('heading', { name: 'Webhook logs' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Event' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Endpoint URL' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Sent at' })).toBeInTheDocument();
        expect(screen.getByText('post.published')).toBeInTheDocument();
        expect(screen.getByText('https://example.com/hook')).toBeInTheDocument();
        const statusDot = document.querySelector('[data-webhook-delivery-status="success"]');
        expect(statusDot).not.toBeNull();
        expect(statusDot?.nextElementSibling).toHaveClass('sr-only');
        expect(statusDot?.nextElementSibling).toHaveTextContent('Success');
        expect(screen.getByText('HTTP 200')).toBeInTheDocument();
        expect(document.querySelector('[data-webhook-delivery-detail]')).toBeNull();
        expect(document.querySelector('[data-webhook-deliveries-pagination="true"]')).toBeNull();
    });

    it('calls onSelectDelivery when a log row is clicked', async () => {
        const user = userEvent.setup();
        const onSelectDelivery = vi.fn();

        render(withCanvas(<WebhookDeliveriesPanel open enabled onSelectDelivery={onSelectDelivery} />, boot));

        await waitFor(() => {
            expect(document.querySelector('[data-webhook-delivery="del-1"]')).not.toBeNull();
        });

        await user.click(document.querySelector('[data-webhook-delivery="del-1"]') as HTMLElement);

        expect(onSelectDelivery).toHaveBeenCalledTimes(1);
        expect(onSelectDelivery.mock.calls[0]?.[0]).toMatchObject({
            id: 'del-1',
            event: 'post.published',
        });
    });

    it('shows empty copy inside the table', async () => {
        webhookDeliveriesMock.mockResolvedValue(pageResult([]));

        render(withCanvas(<WebhookDeliveriesPanel open enabled />, boot));

        await waitFor(() => {
            expect(document.querySelector('[data-webhook-deliveries-empty="true"]')).not.toBeNull();
        });

        expect(screen.getByText('No deliveries yet.')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Event' })).toBeInTheDocument();
        expect(document.querySelector('[data-webhook-delivery-detail]')).toBeNull();
    });

    it('fires webhookDeliveries with page, status, and event filters', async () => {
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

        await user.selectOptions(screen.getByLabelText('Filter by status'), 'failed');

        await waitFor(() => {
            const last = webhookDeliveriesMock.mock.calls.at(-1)?.[0];
            expect(last).toMatchObject({ page: 1, status: 'failed' });
        });

        await user.selectOptions(screen.getByLabelText('Filter by event'), 'post.published');

        await waitFor(() => {
            const last = webhookDeliveriesMock.mock.calls.at(-1)?.[0];
            expect(last).toMatchObject({ page: 1, status: 'failed', event: 'post.published' });
        });
    });

    it('shows filtered empty copy when filters match nothing', async () => {
        webhookDeliveriesMock.mockResolvedValue(pageResult([]));

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

    it('paginates from component state when last_page is greater than 1', async () => {
        const user = userEvent.setup();
        webhookDeliveriesMock.mockImplementation((params: { page?: number } = {}) => {
            const current = params.page ?? 1;

            return Promise.resolve(
                pageResult([delivery({ id: `del-${current}`, event: `post.page-${current}` })], {
                    current_page: current,
                    last_page: 3,
                    total: 45,
                })
            );
        });

        render(withCanvas(<WebhookDeliveriesPanel open enabled />, boot));

        await waitFor(() => {
            expect(screen.getByText('post.page-1')).toBeInTheDocument();
        });

        expect(document.querySelector('[data-webhook-deliveries-pagination="true"]')).not.toBeNull();

        const pagination = document.querySelector('[data-webhook-deliveries-pagination="true"]');
        expect(pagination).not.toBeNull();
        await user.click(within(pagination as HTMLElement).getByText('2'));

        await waitFor(() => {
            const last = webhookDeliveriesMock.mock.calls.at(-1)?.[0];
            expect(last).toMatchObject({ page: 2 });
            expect(screen.getByText('post.page-2')).toBeInTheDocument();
        });

        expect(document.querySelector('[data-webhook-delivery-detail]')).toBeNull();
    });
});
