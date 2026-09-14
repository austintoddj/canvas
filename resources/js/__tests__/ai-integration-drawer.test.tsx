// @vitest-environment happy-dom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AiIntegrationDrawer } from '@/components/integrations/AiIntegrationDrawer';
import type { IntegrationsStatus } from '@/lib/api/integrations';
import { toast } from '@/lib/toast';

import { makeBoot, withCanvas } from './helpers/boot';

const updateMock = vi.fn();

vi.mock('@/lib/api/integrations', async () => {
    const actual = await vi.importActual<typeof import('@/lib/api/integrations')>('@/lib/api/integrations');

    return {
        ...actual,
        integrationsApi: {
            ...actual.integrationsApi,
            update: (...args: unknown[]) => updateMock(...args),
        },
    };
});

vi.mock('@/lib/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

function baseStatus(overrides: Partial<IntegrationsStatus['ai']> = {}): IntegrationsStatus {
    return {
        unsplash: { status: 'off', configured: false, masked_key: null, enabled_at: null },
        ai: {
            status: 'enabled',
            configured: true,
            provider: 'xai',
            masked_key: '••••key1',
            model: null,
            enabled_at: '2026-01-01T00:00:00Z',
            ...overrides,
        },
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
    };
}

const boot = makeBoot({
    translations: JSON.stringify({
        'integrations.ai': 'AI writing',
        'integrations.connect_ai': 'Connect AI',
        'integrations.ai_settings': 'AI provider settings',
        'integrations.ai_connected': 'AI writing connected.',
        'integrations.ai_saved': 'AI settings saved.',
        'integrations.ai_disconnected': 'AI writing disconnected.',
        'integrations.ai_provider': 'Provider',
        'integrations.api_key': 'API key',
        'integrations.copy': 'Copy',
        'integrations.copied': 'Copied.',
        'integrations.copy_error': 'Unable to copy.',
        'integrations.model': 'Model',
        'integrations.model_tier_auto': 'Default',
        'integrations.select_provider': 'Select a provider',
        'integrations.placeholder_api_key': 'Paste your API key',
        'common.close': 'Close',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.saving': 'Saving…',
        'integrations.disconnect': 'Disconnect',
        'integrations.disconnect_ai_title': 'Disconnect AI writing?',
        'integrations.ai_usage_help': 'Usage and billing:',
    }),
});

function renderPage(ui: React.ReactElement) {
    return render(withCanvas(<MemoryRouter initialEntries={['/integrations/ai']}>{ui}</MemoryRouter>, boot));
}

function renderDrawer(props: Partial<React.ComponentProps<typeof AiIntegrationDrawer>> = {}) {
    const onClose = props.onClose ?? (() => undefined);
    const onStatusChange = props.onStatusChange ?? (() => undefined);

    return renderPage(
        <AiIntegrationDrawer
            open
            configured
            provider="xai"
            model={null}
            maskedKey="••••key1"
            onClose={onClose}
            onStatusChange={onStatusChange}
            {...props}
        />
    );
}

describe('AiIntegrationDrawer', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        updateMock.mockReset();
        vi.mocked(toast.success).mockReset();
        vi.mocked(toast.error).mockReset();
    });

    it('is a SideDrawer and not a full-page settings layout', () => {
        renderDrawer();

        expect(document.querySelector('[data-side-drawer]')).not.toBeNull();
        expect(screen.getByRole('dialog', { name: /AI provider settings/i })).toBeInTheDocument();
        expect(document.querySelector('[data-integration-page="true"]')).toBeNull();
        expect(document.querySelector('[data-integration-hero="ai"]')).toBeNull();
        expect(document.querySelector('[data-integration-section="settings"]')).toBeNull();
        const input = document.querySelector('[data-ai-api-key="true"]') as HTMLInputElement;
        expect(input.value).toBe('••••key1');
        expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled();
    });

    it('opens and closes from the open prop and Cancel', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        const { rerender } = renderDrawer({ onClose });

        expect(screen.getByRole('dialog', { name: /AI provider settings/i })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /^Cancel$/i }));
        expect(onClose).toHaveBeenCalledTimes(1);

        rerender(
            withCanvas(
                <MemoryRouter initialEntries={['/integrations/ai']}>
                    <AiIntegrationDrawer
                        open={false}
                        configured
                        provider="xai"
                        model={null}
                        maskedKey="••••key1"
                        onClose={onClose}
                        onStatusChange={() => undefined}
                    />
                </MemoryRouter>,
                boot
            )
        );

        await waitFor(() => {
            expect(screen.queryByRole('dialog', { name: /AI provider settings/i })).toBeNull();
        });
    });

    it('asks to confirm disconnect and closes the drawer on success', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        updateMock.mockResolvedValue(
            baseStatus({
                status: 'off',
                configured: false,
                provider: null,
                masked_key: null,
                model: null,
                enabled_at: null,
            })
        );

        renderDrawer({ onClose });

        await user.click(screen.getByRole('button', { name: /^Disconnect$/i }));
        expect(screen.getByText(/Disconnect AI writing\?/i)).toBeInTheDocument();

        const confirmButtons = screen.getAllByRole('button', { name: /^Disconnect$/i });
        await user.click(confirmButtons[confirmButtons.length - 1] as HTMLElement);

        await waitFor(() => {
            expect(updateMock).toHaveBeenCalledWith({
                ai: { api_key: null },
            });
        });

        await waitFor(() => {
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
