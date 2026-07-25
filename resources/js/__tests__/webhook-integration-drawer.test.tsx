// @vitest-environment happy-dom

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WebhookIntegrationDrawer } from '@/components/integrations/WebhookIntegrationDrawer';
import type { IntegrationsStatus, WebhookEventOption } from '@/lib/api/integrations';

import { withCanvas } from './helpers/boot';

const updateMock = vi.fn();

vi.mock('@/lib/api/integrations', async () => {
    const actual = await vi.importActual<typeof import('@/lib/api/integrations')>('@/lib/api/integrations');

    return {
        ...actual,
        integrationsApi: {
            ...actual.integrationsApi,
            update: (...args: unknown[]) => updateMock(...args),
            testWebhook: vi.fn(),
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
        unsplash: { configured: false, masked_key: null, enabled_at: null },
        ai: { configured: false, provider: null, masked_key: null, model: null, enabled_at: null },
        webhooks: {
            configured: true,
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
 * Mirrors Integrations index: status updates replace events/available_events
 * with new array references from the API response.
 */
function ControlledDrawer() {
    const [status, setStatus] = useState(() => baseStatus());

    return (
        <WebhookIntegrationDrawer
            open
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

describe('WebhookIntegrationDrawer secret dialog', () => {
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

        render(withCanvas(<ControlledDrawer />));

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

        // No amber drawer banner — secret lives only in the dialog.
        expect(
            document.querySelector('[data-integration-drawer="webhooks"] [data-webhook-plain-secret="true"]')
        ).toBeNull();

        // Parent re-render with new array refs must not dismiss the dialog.
        await waitFor(() => {
            expect(document.querySelector('[data-webhook-plain-secret="true"]')).toHaveTextContent(plain);
        });
    });
});
