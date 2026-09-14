// @vitest-environment happy-dom

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WebhookIntegrationDrawer } from '@/components/integrations/WebhookIntegrationDrawer';
import {
    integrationsApi,
    type IntegrationsStatus,
    type WebhookDelivery,
    type WebhookEventOption,
} from '@/lib/api/integrations';
import type { Paginated } from '@/types/api';
import { toast } from '@/lib/toast';

import { makeBoot } from './helpers/boot';
import { canvasTree, renderWithCanvas } from './helpers/render';

const updateMock = vi.fn();

vi.mock('@/lib/api/integrations', async () => {
    const actual = await vi.importActual<typeof import('@/lib/api/integrations')>('@/lib/api/integrations');

    return {
        ...actual,
        integrationsApi: {
            ...actual.integrationsApi,
            update: (...args: unknown[]) => updateMock(...args),
            testWebhook: vi.fn(),
            webhookDeliveries: vi.fn().mockResolvedValue({
                data: [],
                current_page: 1,
                last_page: 1,
                per_page: 15,
                total: 0,
            }),
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
    { id: 'post.published', label: 'Published', description: 'When a draft goes live.' },
    { id: 'post.scheduled', label: 'Scheduled' },
];

function baseStatus(overrides: Partial<IntegrationsStatus['webhooks']> = {}): IntegrationsStatus {
    return {
        unsplash: { status: 'off', configured: false, masked_key: null, enabled_at: null },
        ai: { status: 'off', configured: false, provider: null, masked_key: null, model: null, enabled_at: null },
        webhooks: {
            status: 'enabled',
            configured: true,
            pending: false,
            url: 'https://example.com/hooks/canvas',
            masked_secret: '••••abcd',
            events: ['post.published'],
            enabled_at: '2026-01-01T00:00:00Z',
            available_events: AVAILABLE,
            ...overrides,
        },
    };
}

/**
 * Mirrors Integrations detail page: status updates replace events/available_events
 * with new array references from the API response.
 */
function ControlledDrawer({ open = true }: { open?: boolean }) {
    const [status, setStatus] = useState(() => baseStatus());

    return (
        <WebhookIntegrationDrawer
            open={open}
            configured={status.webhooks.configured}
            pending={status.webhooks.pending}
            url={status.webhooks.url}
            maskedSecret={status.webhooks.masked_secret}
            events={[...status.webhooks.events]}
            availableEvents={status.webhooks.available_events.map((option) => ({ ...option }))}
            onClose={() => undefined}
            onStatusChange={setStatus}
        />
    );
}

const boot = makeBoot({
    translations: {
        'integrations.title': 'Integrations',
        'integrations.webhooks': 'Webhooks',
        'integrations.webhooks_help': 'Notify external services.',
        'integrations.webhooks_add': 'Add a webhook',
        'integrations.enabled': 'Enabled',
        'integrations.webhooks_status_pending': 'Pending',
        'integrations.webhooks_rotate_secret': 'Rotate secret',
        'integrations.webhooks_rotate_title': 'Rotate signing secret?',
        'integrations.webhooks_rotate_body': 'The new secret is shown once.',
        'integrations.webhooks_secret_rotated': 'Signing secret rotated.',
        'integrations.webhooks_secret_once_help': "Copy this and save it somewhere. You won't see it again.",
        'integrations.webhooks_copy_secret': 'Copy secret',
        'integrations.copy': 'Copy',
        'integrations.copied': 'Copied.',
        'integrations.copy_error': 'Unable to copy.',
        'integrations.webhooks_test_failed': 'The test webhook could not be delivered.',
        'integrations.webhooks_send_test': 'Send test',
        'integrations.disconnect': 'Disconnect',
        'integrations.disconnect_webhooks_title': 'Disconnect webhooks?',
        'integrations.webhooks_settings': 'Webhook settings',
        'integrations.webhooks_logs': 'Webhook logs',
        'integrations.webhooks_view_more': 'View more',
        'integrations.webhooks_logs_event': 'Event',
        'integrations.webhooks_logs_sent_at': 'Sent at',
        'integrations.webhooks_deliveries_empty': 'No deliveries yet.',
        'integrations.webhooks_secret': 'Signing secret',
        'integrations.webhooks_url': 'Endpoint URL',
        'integrations.webhooks_events': 'Events',
    },
});

function renderPage(ui: React.ReactElement) {
    return renderWithCanvas(ui, { boot, path: '/integrations/webhooks' });
}

function renderDrawer(props: Partial<React.ComponentProps<typeof WebhookIntegrationDrawer>> = {}) {
    const onClose = props.onClose ?? (() => undefined);
    const onStatusChange = props.onStatusChange ?? (() => undefined);

    return renderPage(
        <WebhookIntegrationDrawer
            open
            configured
            url="https://example.com/hooks/canvas"
            maskedSecret="••••abcd"
            events={['post.published']}
            availableEvents={AVAILABLE}
            onClose={onClose}
            onStatusChange={onStatusChange}
            {...props}
        />
    );
}

describe('WebhookIntegrationDrawer', () => {
    beforeEach(() => {
        updateMock.mockReset();
        vi.mocked(toast.success).mockReset();
        vi.mocked(toast.error).mockReset();
    });

    it('is a SideDrawer and not a full-page settings layout', () => {
        renderDrawer();

        expect(document.querySelector('[data-side-drawer]')).not.toBeNull();
        expect(screen.getByRole('dialog', { name: /Webhook settings/i })).toBeInTheDocument();
        expect(document.querySelector('[data-integration-page="true"]')).toBeNull();
        expect(document.querySelector('[data-integration-hero="webhooks"]')).toBeNull();
        expect(document.querySelector('[data-integration-section="settings"]')).toBeNull();
        expect(screen.getByRole('link', { name: 'View more' })).toHaveAttribute('href', '/integrations/webhooks');
        expect(document.querySelector('[data-webhook-logs-preview="true"]')).not.toBeNull();
        expect(screen.queryByRole('link', { name: 'Webhook logs' })).toBeNull();
        const secret = document.querySelector('[data-masked-secret="true"]') as HTMLInputElement;
        expect(secret).not.toBeNull();
        expect(secret.tagName).toBe('INPUT');
        expect(secret.value).toBe('••••abcd');
        expect(secret.readOnly).toBe(true);
    });

    it('previews recent deliveries in a headerless table', async () => {
        vi.mocked(integrationsApi.webhookDeliveries).mockResolvedValueOnce({
            data: [
                {
                    id: 'del-preview-1',
                    event: 'post.published',
                    url: 'https://example.com/hooks/canvas',
                    status: 'success',
                    http_status: 200,
                    attempts: 1,
                    payload: null,
                    response_body: null,
                    error_message: null,
                    post_id: null,
                    finished_at: '2026-08-01T12:00:01Z',
                    created_at: '2026-08-01T12:00:00Z',
                    updated_at: '2026-08-01T12:00:01Z',
                },
            ],
            current_page: 1,
            last_page: 1,
            per_page: 5,
            total: 1,
            from: 1,
            to: 1,
            first_page_url: '/integrations/webhooks/deliveries?page=1',
            last_page_url: '/integrations/webhooks/deliveries?page=1',
            next_page_url: null,
            prev_page_url: null,
            path: '/integrations/webhooks/deliveries',
            links: [],
        } as Paginated<WebhookDelivery>);

        renderDrawer();

        await waitFor(() => {
            expect(document.querySelector('[data-webhook-logs-preview-row="del-preview-1"]')).not.toBeNull();
        });

        expect(document.querySelector('[data-webhook-logs-preview="true"] thead')).toBeNull();
        expect(document.querySelector('[data-webhook-logs-preview-row="del-preview-1"]')).toHaveTextContent(
            'post.published'
        );
        expect(vi.mocked(integrationsApi.webhookDeliveries)).toHaveBeenCalledWith(
            expect.objectContaining({ per_page: 5 }),
            expect.anything()
        );
    });

    it('opens and closes from the open prop and Cancel', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        const { rerender } = renderDrawer({ onClose });

        expect(screen.getByRole('dialog', { name: /Webhook settings/i })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /^Cancel$/i }));
        expect(onClose).toHaveBeenCalledTimes(1);

        rerender(
            canvasTree(
                <WebhookIntegrationDrawer
                    open={false}
                    configured
                    url="https://example.com/hooks/canvas"
                    maskedSecret="••••abcd"
                    events={['post.published']}
                    availableEvents={AVAILABLE}
                    onClose={onClose}
                    onStatusChange={() => undefined}
                />,
                { boot, path: '/integrations/webhooks' }
            )
        );

        await waitFor(() => {
            expect(screen.queryByRole('dialog', { name: /Webhook settings/i })).toBeNull();
        });
    });

    it('enables webhooks and keeps the drawer open to show the one-time secret', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        const plain = 'b'.repeat(64);

        updateMock.mockResolvedValue(
            baseStatus({
                configured: true,
                pending: false,
                status: 'enabled',
                plain_secret: plain,
                masked_secret: '••••bbbb',
            })
        );

        renderDrawer({
            configured: false,
            pending: false,
            url: null,
            maskedSecret: null,
            events: [],
            onClose,
        });

        expect(screen.getByRole('dialog', { name: /Add a webhook/i })).toBeInTheDocument();

        const urlInput = document.querySelector('[data-webhook-url="true"]') as HTMLInputElement;
        await user.clear(urlInput);
        await user.type(urlInput, 'https://hooks.example.com/canvas');

        expect(screen.queryByRole('button', { name: /^Save$/i })).toBeNull();
        await user.click(screen.getByRole('button', { name: /^Send test$/i }));

        await waitFor(() => {
            expect(updateMock).toHaveBeenCalledWith({
                webhooks: {
                    url: 'https://hooks.example.com/canvas',
                    events: ['post.published', 'post.scheduled'],
                },
            });
        });

        await waitFor(() => {
            expect(document.querySelector('[data-webhook-plain-secret="true"]')).toHaveTextContent(plain);
        });
        expect(onClose).not.toHaveBeenCalled();
        expect(document.querySelector('[data-side-drawer]')).not.toBeNull();
        expect(screen.getByText('Add a webhook')).toBeInTheDocument();
        expect(screen.getByText(/Copy this and save it somewhere. You won't see it again./i)).toBeInTheDocument();
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('closes the drawer after a save that does not reveal a new secret', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        updateMock.mockResolvedValue(baseStatus({ url: 'https://example.com/hooks/updated' }));

        renderDrawer({ onClose });

        const urlInput = document.querySelector('[data-webhook-url="true"]') as HTMLInputElement;
        await user.clear(urlInput);
        await user.type(urlInput, 'https://example.com/hooks/updated');

        await user.click(screen.getByRole('button', { name: /^Save$/i }));

        await waitFor(() => {
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it('morphs the rotate dialog into a copy step and keeps the secret after status updates', async () => {
        const user = userEvent.setup();
        const plain = 'a'.repeat(64);

        updateMock.mockResolvedValue(
            baseStatus({
                plain_secret: plain,
                masked_secret: '••••aaaa',
            })
        );

        renderPage(<ControlledDrawer />);

        await user.click(screen.getByRole('button', { name: /Rotate secret/i }));
        expect(screen.getByText(/Rotate signing secret\?/i)).toBeInTheDocument();

        await user.click(document.querySelector('[data-webhook-rotate-confirm="true"]') as HTMLElement);

        await waitFor(() => {
            expect(document.querySelector('[data-webhook-plain-secret="true"]')).not.toBeNull();
        });

        const panel = document.querySelector('[data-webhook-plain-secret="true"]');
        expect(panel).toHaveTextContent(plain);
        expect(screen.getByText(/Signing secret rotated/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Copy secret/i })).toBeInTheDocument();
        expect(document.querySelector('[data-webhook-secret-done="true"]')).not.toBeNull();

        expect(document.querySelector('[data-side-drawer-scroll] [data-webhook-plain-secret="true"]')).toBeNull();

        await waitFor(() => {
            expect(document.querySelector('[data-webhook-plain-secret="true"]')).toHaveTextContent(plain);
        });
    });

    it('keeps send-test when credentials are stored but unverified', () => {
        renderDrawer({
            configured: false,
            pending: true,
            url: 'https://example.com/hooks/canvas',
            maskedSecret: '••••abcd',
            events: ['post.published'],
        });

        expect(screen.getByRole('dialog', { name: /Webhook settings/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send test/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^Save$/i })).toBeDisabled();
        expect(screen.queryByRole('button', { name: /Enable webhooks/i })).toBeNull();
    });

    it('asks to confirm disconnect and closes the drawer on success', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        updateMock.mockResolvedValue(
            baseStatus({
                status: 'off',
                configured: false,
                pending: false,
                url: null,
                masked_secret: null,
                events: [],
            })
        );

        renderDrawer({ onClose });

        await user.click(screen.getByRole('button', { name: /^Disconnect$/i }));
        expect(screen.getByText(/Disconnect webhooks\?/i)).toBeInTheDocument();

        const confirmButtons = screen.getAllByRole('button', { name: /^Disconnect$/i });
        await user.click(confirmButtons[confirmButtons.length - 1] as HTMLElement);

        await waitFor(() => {
            expect(updateMock).toHaveBeenCalledWith({
                webhooks: { url: null },
            });
        });

        await waitFor(() => {
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
