// @vitest-environment happy-dom

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UnsplashIntegrationDrawer } from '@/components/integrations/UnsplashIntegrationDrawer';
import type { IntegrationsStatus } from '@/lib/api/integrations';
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
        },
    };
});

vi.mock('@/lib/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

function baseStatus(overrides: Partial<IntegrationsStatus['unsplash']> = {}): IntegrationsStatus {
    return {
        unsplash: {
            status: 'enabled',
            configured: true,
            masked_key: '••••key1',
            enabled_at: '2026-01-01T00:00:00Z',
            ...overrides,
        },
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
    };
}

const boot = makeBoot({
    translations: {
        'integrations.unsplash': 'Unsplash',
        'integrations.connect_unsplash': 'Connect Unsplash',
        'integrations.unsplash_settings': 'Unsplash settings',
        'integrations.unsplash_connected': 'Unsplash connected.',
        'integrations.unsplash_disconnected': 'Unsplash disconnected.',
        'integrations.access_key': 'Access key',
        'integrations.placeholder_access_key': 'Paste your Unsplash access key',
        'integrations.copy': 'Copy',
        'integrations.copied': 'Copied.',
        'integrations.copy_error': 'Unable to copy.',
        'integrations.disconnect': 'Disconnect',
        'integrations.disconnect_unsplash_title': 'Disconnect Unsplash?',
    },
});

function renderDrawer(props: Partial<React.ComponentProps<typeof UnsplashIntegrationDrawer>> = {}) {
    const onClose = props.onClose ?? (() => undefined);
    const onStatusChange = props.onStatusChange ?? (() => undefined);

    return renderWithCanvas(
        <UnsplashIntegrationDrawer
            open
            configured
            maskedKey="••••key1"
            onClose={onClose}
            onStatusChange={onStatusChange}
            {...props}
        />,
        { boot, path: '/integrations/unsplash' }
    );
}

describe('UnsplashIntegrationDrawer', () => {
    beforeEach(() => {
        updateMock.mockReset();
        vi.mocked(toast.success).mockReset();
        vi.mocked(toast.error).mockReset();
    });

    it('is a SideDrawer and not a full-page settings layout', () => {
        renderDrawer();

        expect(document.querySelector('[data-side-drawer]')).not.toBeNull();
        expect(screen.getByRole('dialog', { name: /Unsplash settings/i })).toBeInTheDocument();
        expect(document.querySelector('[data-integration-page="true"]')).toBeNull();
        expect(document.querySelector('[data-integration-hero="unsplash"]')).toBeNull();
        expect(document.querySelector('[data-integration-section="settings"]')).toBeNull();
    });

    it('shows the access key in a copyable input', async () => {
        const user = userEvent.setup();
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        });

        renderDrawer();

        const input = document.querySelector('[data-unsplash-access-key="true"]') as HTMLInputElement;
        expect(input).not.toBeNull();
        expect(input.value).toBe('••••key1');
        expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled();

        await user.click(screen.getByRole('button', { name: 'Copy' }));
        expect(writeText).toHaveBeenCalledWith('••••key1');
    });

    it('opens and closes from the open prop and Cancel', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        const { rerender } = renderDrawer({ onClose });

        expect(screen.getByRole('dialog', { name: /Unsplash settings/i })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /^Cancel$/i }));
        expect(onClose).toHaveBeenCalledTimes(1);

        rerender(
            canvasTree(
                <UnsplashIntegrationDrawer
                    open={false}
                    configured
                    maskedKey="••••key1"
                    onClose={onClose}
                    onStatusChange={() => undefined}
                />,
                { boot, path: '/integrations/unsplash' }
            )
        );

        await waitFor(() => {
            expect(screen.queryByRole('dialog', { name: /Unsplash settings/i })).toBeNull();
        });
    });

    it('connects Unsplash and closes the drawer', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        updateMock.mockResolvedValue(
            baseStatus({
                configured: true,
                status: 'enabled',
                masked_key: '••••abcd',
            })
        );

        renderDrawer({
            configured: false,
            maskedKey: null,
            onClose,
        });

        expect(screen.getByRole('dialog', { name: /Connect Unsplash/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Save$/i })).toBeNull();

        const keyInput = document.querySelector('[data-unsplash-access-key="true"]') as HTMLInputElement;
        await user.type(keyInput, 'unsplash-access-key');
        await user.click(screen.getByRole('button', { name: /^Connect Unsplash$/i }));

        await waitFor(() => {
            expect(updateMock).toHaveBeenCalledWith({
                unsplash: { access_key: 'unsplash-access-key' },
            });
        });

        await waitFor(() => {
            expect(onClose).toHaveBeenCalledTimes(1);
        });
        expect(toast.success).toHaveBeenCalled();
    });

    it('asks to confirm disconnect and closes the drawer on success', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        updateMock.mockResolvedValue(
            baseStatus({
                status: 'off',
                configured: false,
                masked_key: null,
                enabled_at: null,
            })
        );

        renderDrawer({ onClose });

        await user.click(screen.getByRole('button', { name: /^Disconnect$/i }));
        expect(screen.getByText(/Disconnect Unsplash\?/i)).toBeInTheDocument();

        const confirmButtons = screen.getAllByRole('button', { name: /^Disconnect$/i });
        await user.click(confirmButtons[confirmButtons.length - 1] as HTMLElement);

        await waitFor(() => {
            expect(updateMock).toHaveBeenCalledWith({
                unsplash: { access_key: null },
            });
        });

        await waitFor(() => {
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
