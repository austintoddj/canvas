// @vitest-environment happy-dom

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import WebhooksLogsPage from '@/pages/Integrations/Webhooks';
import type { IntegrationsStatus, WebhookEventOption } from '@/lib/api/integrations';

import { makeBoot } from './helpers/boot';
import { matchMediaFinePointerHover, stubMatchMedia } from './helpers/dom';
import { renderWithCanvas } from './helpers/render';

const showMock = vi.fn();
const webhookDeliveriesMock = vi.fn();

vi.mock('@/lib/api/integrations', async () => {
    const actual = await vi.importActual<typeof import('@/lib/api/integrations')>('@/lib/api/integrations');

    return {
        ...actual,
        integrationsApi: {
            ...actual.integrationsApi,
            show: (...args: unknown[]) => showMock(...args),
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

const AVAILABLE: WebhookEventOption[] = [
    { id: 'post.published', label: 'Published' },
    { id: 'post.scheduled', label: 'Scheduled' },
];

function statusFixture(overrides: Partial<IntegrationsStatus['webhooks']> = {}): IntegrationsStatus {
    return {
        unsplash: { status: 'off', configured: false, masked_key: null, enabled_at: null },
        ai: { status: 'off', configured: false, provider: null, masked_key: null, model: null, enabled_at: null },
        webhooks: {
            status: 'off',
            configured: false,
            pending: false,
            url: null,
            masked_secret: null,
            events: [],
            enabled_at: null,
            available_events: AVAILABLE,
            ...overrides,
        },
    };
}

const boot = makeBoot({
    translations: {
        'integrations.title': 'Integrations',
        'integrations.webhooks_logs': 'Webhook logs',
        'integrations.webhooks_logs_retention': 'Retains logs for 30 days.',
        'integrations.webhooks_logs_event': 'Event',
        'integrations.webhooks_logs_sent_at': 'Sent at',
        'integrations.webhooks_url': 'Endpoint URL',
        'integrations.webhooks_status': 'Status',
        'integrations.webhooks_deliveries_refresh': 'Refresh',
        'integrations.webhooks_deliveries_empty': 'No deliveries yet.',
        'integrations.webhooks_deliveries_filter_status': 'Filter by status',
        'integrations.webhooks_deliveries_filter_event': 'Filter by event',
        'integrations.webhooks_deliveries_filter_all_statuses': 'All statuses',
        'integrations.webhooks_deliveries_filter_all_events': 'All events',
        'integrations.webhooks_delivery_summary': 'Summary',
        'integrations.webhooks_delivery_payload': 'Payload',
        'integrations.webhooks_delivery_http_status': 'HTTP status',
        'integrations.webhooks_delivery_attempts': 'Attempts',
        'integrations.webhooks_copy_id': 'Copy',
        'integrations.webhooks_deliveries_id': 'Delivery id',
        'integrations.webhooks_deliveries_error': 'Error',
        'integrations.webhooks_deliveries_response': 'Response',
        'integrations.webhooks_deliveries_status_success': 'Success',
        'integrations.webhooks_deliveries_status_failed': 'Failed',
        'integrations.webhooks_deliveries_retry': 'Retry',
        'common.type': 'Type',
        'integrations.load_error': 'Unable to load integrations.',
    },
});

function renderPage() {
    return renderWithCanvas(<WebhooksLogsPage />, { boot, path: '/integrations/webhooks' });
}

describe('Integrations webhook logs page', () => {
    beforeEach(() => {
        showMock.mockReset();
        webhookDeliveriesMock.mockReset();
        webhookDeliveriesMock.mockResolvedValue({
            data: [],
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 0,
        });
        stubMatchMedia(matchMediaFinePointerHover);
    });

    it('is a standalone logs page with no webhook settings hub', async () => {
        showMock.mockResolvedValue(statusFixture());

        renderPage();

        await waitFor(() => {
            expect(document.getElementById('webhook-logs')).not.toBeNull();
        });

        expect(screen.getByRole('heading', { level: 1, name: 'Webhook logs' })).toBeInTheDocument();
        expect(screen.getByText('Retains logs for 30 days.')).toBeInTheDocument();
        expect(document.querySelector('[data-integration-back]')?.getAttribute('href')).toBe('/integrations');
        expect(document.querySelector('[data-webhook-deliveries="true"]')).not.toBeNull();
        expect(document.querySelector('[data-webhook-deliveries-refresh="true"]')).not.toBeNull();

        expect(screen.queryByRole('button', { name: 'Add webhook' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Send test' })).toBeNull();
        expect(document.querySelector('[data-webhooks-hub="true"]')).toBeNull();
        expect(document.querySelector('[data-webhooks-table="true"]')).toBeNull();
        expect(document.querySelector('[data-webhook-row="true"]')).toBeNull();
        expect(document.querySelector('[data-side-drawer]')).toBeNull();
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.queryByRole('heading', { level: 2, name: 'Webhook logs' })).toBeNull();
    });

    it('opens a delivery detail drawer from a log row', async () => {
        const user = userEvent.setup();
        showMock.mockResolvedValue(
            statusFixture({
                status: 'enabled',
                configured: true,
                url: 'https://hooks.example.com/canvas',
                masked_secret: '••••abcd',
                events: ['post.published'],
            })
        );
        webhookDeliveriesMock.mockResolvedValue({
            data: [
                {
                    id: 'del-page-1',
                    event: 'post.published',
                    url: 'https://hooks.example.com/canvas',
                    status: 'success',
                    http_status: 200,
                    attempts: 1,
                    payload: { event: 'post.published' },
                    response_body: null,
                    error_message: null,
                    post_id: 'post-1',
                    finished_at: '2026-08-01T12:00:01Z',
                    created_at: '2026-08-01T12:00:00Z',
                    updated_at: '2026-08-01T12:00:01Z',
                },
            ],
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 1,
        });

        renderPage();

        await waitFor(() => {
            expect(document.querySelector('[data-webhook-delivery="del-page-1"]')).not.toBeNull();
        });

        await user.click(document.querySelector('[data-webhook-delivery="del-page-1"]') as HTMLElement);

        await waitFor(() => {
            expect(screen.getByRole('dialog', { name: 'post.published' })).toBeInTheDocument();
        });

        expect(document.querySelector('[data-webhook-delivery-drawer="true"]')).not.toBeNull();
        expect(screen.getByRole('radio', { name: 'Summary' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Payload' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    });
});
