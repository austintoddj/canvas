// @vitest-environment happy-dom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WebhookIntegrationDrawer } from '@/components/integrations/WebhookIntegrationDrawer';
import type { IntegrationsStatus, WebhookEventOption } from '@/lib/api/integrations';

import { makeBoot, withCanvas } from './helpers/boot';

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
function ControlledDrawer() {
    const [status, setStatus] = useState(() => baseStatus());

    return (
        <WebhookIntegrationDrawer
            configured={status.webhooks.configured}
            url={status.webhooks.url}
            maskedSecret={status.webhooks.masked_secret}
            events={[...status.webhooks.events]}
            availableEvents={status.webhooks.available_events.map((option) => ({ ...option }))}
            enabledAt={status.webhooks.enabled_at}
            onClose={() => undefined}
            onStatusChange={setStatus}
        />
    );
}

const boot = makeBoot({
    translations: JSON.stringify({
        'integrations.title': 'Integrations',
        'integrations.webhooks': 'Webhooks',
        'integrations.webhooks_help': 'Notify external services.',
        'integrations.enabled': 'Enabled',
        'integrations.not_enabled': 'Not enabled',
        'integrations.connecting_progress': 'Connecting…',
        'integrations.webhooks_pending_help':
            'Copy the signing secret into your receiver, then send a test. Events wait until the endpoint returns 2xx.',
        'integrations.webhooks_verify_failed':
            'The endpoint did not accept the test webhook. Webhooks stay off until a test succeeds.',
        'integrations.webhooks_rotate_secret': 'Rotate secret',
        'integrations.webhooks_rotate_title': 'Rotate signing secret?',
        'integrations.webhooks_rotate_body': 'A new secret is generated and shown once.',
        'integrations.webhooks_secret_rotated': 'Signing secret rotated.',
        'integrations.webhooks_secret_once_help':
            'This is shown once. Store it with your receiver to verify Canvas-Signature headers.',
        'integrations.webhooks_copy_secret': 'Copy secret',
        'common.close': 'Close',
        'common.cancel': 'Cancel',
        'common.saving': 'Saving…',
        'integrations.save_settings': 'Save settings',
        'integrations.webhooks_send_test': 'Send test',
        'integrations.disconnect': 'Disconnect',
        'integrations.danger_zone': 'Danger zone',
        'integrations.settings': 'Settings',
        'integrations.webhooks_secret': 'Signing secret',
    }),
});

function renderPage(ui: React.ReactElement) {
    return render(withCanvas(<MemoryRouter initialEntries={['/integrations/webhooks']}>{ui}</MemoryRouter>, boot));
}

describe('WebhookIntegrationDrawer secret dialog', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        updateMock.mockReset();
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

        // Secret lives only in the dialog — not inline in page sections.
        expect(
            document.querySelector('[data-integration-sections="webhooks"] [data-webhook-plain-secret="true"]')
        ).toBeNull();

        // Parent re-render with new array refs must not dismiss the dialog.
        await waitFor(() => {
            expect(document.querySelector('[data-webhook-plain-secret="true"]')).toHaveTextContent(plain);
        });
    });

    it('renders page IA: hero, sectioned cards, back control — not a SideDrawer', () => {
        renderPage(
            <WebhookIntegrationDrawer
                configured
                url="https://example.com/hooks/canvas"
                maskedSecret="••••abcd"
                events={['post.published']}
                availableEvents={AVAILABLE}
                enabledAt="2026-01-01T00:00:00Z"
                onClose={() => undefined}
                onStatusChange={() => undefined}
            />
        );

        expect(document.querySelector('[data-integration-page="true"]')).not.toBeNull();
        expect(document.querySelector('[data-integration-hero="webhooks"]')).not.toBeNull();
        // Hero summary chips and “How it works” are omitted — settings already show the endpoint/events.
        expect(document.querySelector('[data-integration-summary="webhooks"]')).toBeNull();
        expect(document.querySelector('[data-integration-section="about"]')).toBeNull();
        expect(document.querySelector('[data-integration-section="settings"]')).not.toBeNull();
        expect(document.querySelector('[data-integration-section="caution"]')).not.toBeNull();
        expect(document.querySelector('[data-integration-section="danger"]')).not.toBeNull();
        expect(document.querySelector('[data-side-drawer]')).toBeNull();

        const back = document.querySelector('[data-integration-back]') as HTMLAnchorElement | null;
        expect(back).not.toBeNull();
        expect(back?.getAttribute('href')).toBe('/integrations');
        expect(back).toHaveTextContent(/Integrations/i);
    });

    it('keeps not-enabled and send-test when credentials are stored but unverified', () => {
        renderPage(
            <WebhookIntegrationDrawer
                configured={false}
                pending
                url="https://example.com/hooks/canvas"
                maskedSecret="••••abcd"
                events={['post.published']}
                availableEvents={AVAILABLE}
                onClose={() => undefined}
                onStatusChange={() => undefined}
            />
        );

        expect(document.querySelector('[data-integration-status="off"]')).not.toBeNull();
        expect(screen.getByText('Not enabled')).toBeInTheDocument();
        expect(screen.queryByText('Connecting')).toBeNull();
        expect(screen.getByText(/Copy the signing secret into your receiver/i)).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /Send test/i }).length).toBeGreaterThan(0);
        expect(document.querySelector('[data-integration-section="caution"]')).not.toBeNull();
        expect(document.querySelector('[data-integration-section="danger"]')).not.toBeNull();
    });
});
