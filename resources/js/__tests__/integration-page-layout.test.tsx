// @vitest-environment happy-dom

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { IntegrationPageShell } from '@/components/integrations/IntegrationPageLayout';
import { IntegrationsListSkeleton } from '@/components/integrations/IntegrationsListSkeleton';

import { makeBoot } from './helpers/boot';
import { renderWithCanvas } from './helpers/render';

const boot = makeBoot({
    translations: {
        'integrations.title': 'Integrations',
        'integrations.configure': 'Configure',
        'integrations.enabled': 'Enabled',
        'integrations.not_enabled': 'Not enabled',
    },
});

function renderWithRouter(ui: React.ReactElement, path = '/integrations/webhooks') {
    return renderWithCanvas(ui, { boot, path });
}

describe('IntegrationPageShell', () => {
    it('links back to the Integrations list', () => {
        renderWithRouter(
            <IntegrationPageShell>
                <div data-testid="body">hub</div>
            </IntegrationPageShell>
        );

        const back = document.querySelector('[data-integration-back]') as HTMLAnchorElement | null;
        expect(back).not.toBeNull();
        expect(back?.getAttribute('href')).toBe('/integrations');
        expect(back).toHaveTextContent('Integrations');
        expect(document.querySelector('[data-integration-page="true"]')).not.toBeNull();
        expect(screen.getByTestId('body')).toBeInTheDocument();
        expect(document.querySelector('[data-integration-hero]')).toBeNull();
        expect(document.querySelector('[data-integration-section="settings"]')).toBeNull();
    });
});

describe('IntegrationCard', () => {
    it('renders as a clickable card with status and configure affordance', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        renderWithRouter(
            <IntegrationCard
                kind="webhooks"
                title="Webhooks"
                description="Notify external services"
                status="off"
                configuredLabel="Enabled"
                notConfiguredLabel="Not enabled"
                actionLabel="Configure"
                onClick={onClick}
            />,
            '/integrations'
        );

        const card = document.querySelector('[data-integration-card="webhooks"]') as HTMLElement | null;
        expect(card).not.toBeNull();
        expect(card?.tagName).toBe('BUTTON');
        expect(card?.className).toMatch(/cursor-pointer/);
        expect(card?.className).toMatch(/rounded/);
        expect(card?.className).toMatch(/border/);
        expect(within(card!).getByText('Webhooks')).toBeInTheDocument();
        expect(within(card!).getByText('Notify external services')).toBeInTheDocument();
        expect(within(card!).getByText('Not enabled')).toBeInTheDocument();
        expect(within(card!).getByText('Configure')).toBeInTheDocument();
        expect(within(card!).queryByRole('link')).toBeNull();

        await user.click(card!);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('shows enabled status when configured', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        renderWithRouter(
            <IntegrationCard
                kind="unsplash"
                title="Unsplash"
                description="Stock photos"
                status="enabled"
                configuredLabel="Enabled"
                notConfiguredLabel="Not enabled"
                actionLabel="Configure"
                onClick={onClick}
            />,
            '/integrations'
        );

        const card = document.querySelector('[data-integration-card="unsplash"]') as HTMLElement | null;
        expect(card).not.toBeNull();
        expect(within(card!).getByText('Enabled')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Configure Unsplash' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Configure Unsplash' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('covers all three integration kinds as clickable cards', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        const kinds = [
            { kind: 'unsplash' as const, title: 'Unsplash' },
            { kind: 'ai' as const, title: 'AI writing' },
            { kind: 'webhooks' as const, title: 'Webhooks' },
        ];

        renderWithRouter(
            <div data-integrations-cards="true" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {kinds.map((item) => (
                    <IntegrationCard
                        key={item.kind}
                        kind={item.kind}
                        title={item.title}
                        description={`${item.title} help`}
                        status="off"
                        configuredLabel="Enabled"
                        notConfiguredLabel="Not enabled"
                        actionLabel="Configure"
                        onClick={() => onClick(item.kind)}
                    />
                ))}
            </div>,
            '/integrations'
        );

        const grid = document.querySelector('[data-integrations-cards="true"]') as HTMLElement | null;
        expect(grid).not.toBeNull();
        expect(grid?.className).toMatch(/grid/);
        expect(grid?.className).not.toMatch(/divide-y/);

        for (const item of kinds) {
            const card = document.querySelector(`[data-integration-card="${item.kind}"]`) as HTMLElement | null;
            expect(card).not.toBeNull();
            expect(card?.tagName).toBe('BUTTON');
            expect(card?.className).toMatch(/cursor-pointer/);
            expect(within(card!).getByText(item.title)).toBeInTheDocument();
        }

        expect(within(grid!).queryAllByRole('link')).toHaveLength(0);

        await user.click(screen.getByRole('button', { name: 'Configure Unsplash' }));
        await user.click(screen.getByRole('button', { name: 'Configure AI writing' }));
        await user.click(screen.getByRole('button', { name: 'Configure Webhooks' }));
        expect(onClick).toHaveBeenCalledTimes(3);
        expect(onClick.mock.calls.map((call) => call[0])).toEqual(['unsplash', 'ai', 'webhooks']);
    });
});

describe('IntegrationsListSkeleton', () => {
    it('mirrors the card grid geometry, not a divided row list', () => {
        render(<IntegrationsListSkeleton rows={3} />);

        const skeleton = document.querySelector('[data-integrations-list-skeleton="true"]');
        expect(skeleton).not.toBeNull();
        expect(skeleton?.className).toMatch(/grid/);
        expect(skeleton?.className).toMatch(/xl:grid-cols-4/);
        expect(skeleton?.className).not.toMatch(/divide-y/);
        expect(document.querySelector('[data-integrations-cards-skeleton="true"]')).not.toBeNull();

        const cards = skeleton?.querySelectorAll(':scope > div');
        expect(cards?.length).toBe(3);
    });
});
