// @vitest-environment happy-dom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WebhookDeliveryDrawer } from '@/components/integrations/WebhookDeliveryDrawer';
import type { WebhookDelivery } from '@/lib/api/integrations';
import { toast } from '@/lib/toast';

import { makeBoot, withCanvas } from './helpers/boot';

const retryWebhookDeliveryMock = vi.fn();

vi.mock('@/lib/api/integrations', async () => {
    const actual = await vi.importActual<typeof import('@/lib/api/integrations')>('@/lib/api/integrations');

    return {
        ...actual,
        integrationsApi: {
            ...actual.integrationsApi,
            retryWebhookDelivery: (...args: unknown[]) => retryWebhookDeliveryMock(...args),
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
        'integrations.webhooks_delivery_summary': 'Summary',
        'integrations.webhooks_delivery_payload': 'Payload',
        'integrations.webhooks_delivery_http_status': 'HTTP status',
        'integrations.webhooks_delivery_attempts': 'Attempts',
        'integrations.webhooks_copy_id': 'Copy',
        'integrations.webhooks_payload_empty': 'No payload stored for this delivery.',
        'integrations.webhooks_delivery_id_copied': 'Delivery id copied.',
        'integrations.webhooks_delivery_url_copied': 'URL copied.',
        'integrations.webhooks_delivery_copy_error': 'Unable to copy.',
        'integrations.webhooks_status': 'Status',
        'integrations.webhooks_url': 'Endpoint URL',
        'integrations.webhooks_logs_sent_at': 'Sent at',
        'integrations.webhooks_deliveries_id': 'Delivery id',
        'integrations.webhooks_deliveries_error': 'Error',
        'integrations.webhooks_deliveries_response': 'Response',
        'integrations.webhooks_deliveries_status_pending': 'Pending',
        'integrations.webhooks_deliveries_status_success': 'Success',
        'integrations.webhooks_deliveries_status_failed': 'Failed',
        'integrations.webhooks_deliveries_retry': 'Retry',
        'integrations.webhooks_deliveries_retrying': 'Retrying…',
        'integrations.webhooks_deliveries_retried': 'Delivery queued for retry.',
        'integrations.webhooks_deliveries_retry_error': 'Unable to retry this delivery.',
        'integrations.webhooks_deliveries_retry_not_failed': 'Only failed deliveries can be retried.',
        'common.type': 'Type',
        'common.close': 'Close',
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
        payload: partial.payload ?? { event: 'post.published', id: 'post-1' },
        response_body: partial.response_body ?? '{"ok":true}',
        error_message: partial.error_message ?? null,
        post_id: partial.post_id ?? 'post-1',
        finished_at: partial.finished_at ?? '2026-08-01T12:00:01Z',
        created_at: '2026-08-01T12:00:00Z',
        updated_at: '2026-08-01T12:00:01Z',
        ...partial,
    };
}

function renderDrawer(props: Partial<React.ComponentProps<typeof WebhookDeliveryDrawer>> = {}) {
    const onClose = props.onClose ?? (() => undefined);
    const item = props.delivery === undefined ? delivery() : props.delivery;

    return render(withCanvas(<WebhookDeliveryDrawer open delivery={item} onClose={onClose} {...props} />, boot));
}

afterEach(() => {
    cleanup();
});

describe('WebhookDeliveryDrawer', () => {
    beforeEach(() => {
        retryWebhookDeliveryMock.mockReset();
        vi.mocked(toast.success).mockReset();
        vi.mocked(toast.error).mockReset();
    });

    it('shows summary fields for the selected delivery', () => {
        renderDrawer({
            delivery: delivery({
                id: 'del-summary',
                error_message: 'Connection timed out',
                attempts: 3,
            }),
        });

        expect(screen.getByRole('dialog', { name: 'post.published' })).toBeInTheDocument();
        expect(document.querySelector('[data-webhook-delivery-summary="true"]')).not.toBeNull();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText('HTTP status')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText('https://example.com/hook')).toBeInTheDocument();
        expect(screen.getByText('del-summary')).toBeInTheDocument();
        expect(screen.getByText('Attempts')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Sent at')).toBeInTheDocument();
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Connection timed out')).toBeInTheDocument();
        expect(screen.getByText('Response')).toBeInTheDocument();
        expect(screen.getByText('{"ok":true}')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    });

    it('shows pretty-printed JSON on the payload tab', async () => {
        const user = userEvent.setup();

        renderDrawer({
            delivery: delivery({
                payload: { event: 'webhook.test', delivery_id: 'del-1' },
            }),
        });

        await user.click(screen.getByRole('radio', { name: 'Payload' }));

        const panel = document.querySelector('[data-webhook-delivery-payload="true"]');
        expect(panel).not.toBeNull();
        expect(panel).toHaveTextContent('"event": "webhook.test"');
        expect(panel).toHaveTextContent('"delivery_id": "del-1"');
        expect(document.querySelector('[data-webhook-delivery-summary="true"]')).toBeNull();
    });

    it('shows empty payload copy when none is stored', async () => {
        const user = userEvent.setup();

        renderDrawer({ delivery: delivery({ payload: null }) });

        await user.click(screen.getByRole('radio', { name: 'Payload' }));

        expect(screen.getByText('No payload stored for this delivery.')).toBeInTheDocument();
    });

    it('retries failed deliveries only and reports success', async () => {
        const user = userEvent.setup();
        const onRetried = vi.fn();
        const retried = delivery({ id: 'del-retry', status: 'pending', http_status: null, attempts: 0 });

        retryWebhookDeliveryMock.mockResolvedValue({
            ok: true,
            delivery: retried,
            original_delivery_id: 'del-failed',
        });

        renderDrawer({
            delivery: delivery({
                id: 'del-failed',
                status: 'failed',
                http_status: 500,
                error_message: 'Receiver returned 500',
            }),
            onRetried,
        });

        expect(screen.getByText('Failed')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Retry' }));

        await waitFor(() => {
            expect(retryWebhookDeliveryMock).toHaveBeenCalledWith('del-failed');
        });

        expect(toast.success).toHaveBeenCalledWith('Delivery queued for retry.');
        expect(onRetried).toHaveBeenCalledWith(retried);
    });

    it('closes from the drawer close control', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        renderDrawer({ onClose });

        await user.click(screen.getByRole('button', { name: 'Close' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
