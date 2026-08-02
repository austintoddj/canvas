// @vitest-environment happy-dom

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import {
    IntegrationAboutSection,
    IntegrationPageLayout,
    IntegrationPageShell,
    IntegrationSection,
} from '@/components/integrations/IntegrationPageLayout';
import { IntegrationsListSkeleton } from '@/components/integrations/IntegrationsListSkeleton';

import { withCanvas, makeBoot } from './helpers/boot';

afterEach(() => {
    cleanup();
});

const boot = makeBoot({
    translations: JSON.stringify({
        'integrations.title': 'Integrations',
        'integrations.configure': 'Configure',
        'integrations.enabled': 'Enabled',
        'integrations.not_enabled': 'Not enabled',
        'integrations.settings': 'Settings',
        'integrations.settings_help': 'Connection details used when Canvas talks to this service.',
    }),
});

function renderWithRouter(ui: React.ReactElement, path = '/integrations/ai') {
    return render(withCanvas(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>, boot));
}

describe('IntegrationPageLayout', () => {
    it('links back to the Integrations list and renders a page hero', () => {
        renderWithRouter(
            <IntegrationPageLayout kind="ai" title="AI writing" description="Rewrite and SEO tools" enabled={false}>
                <IntegrationSection title="Settings" data-section="settings">
                    <div data-testid="body">settings</div>
                </IntegrationSection>
            </IntegrationPageLayout>
        );

        const back = document.querySelector('[data-integration-back]') as HTMLAnchorElement | null;
        expect(back).not.toBeNull();
        expect(back?.getAttribute('href')).toBe('/integrations');
        expect(back).toHaveTextContent('Integrations');
        expect(document.querySelector('[data-integration-page="true"]')).not.toBeNull();
        expect(document.querySelector('[data-integration-hero="ai"]')).not.toBeNull();
        expect(screen.getByRole('heading', { name: 'AI writing' })).toBeInTheDocument();
        expect(screen.getByText('Not enabled')).toBeInTheDocument();
        expect(screen.getByTestId('body')).toBeInTheDocument();
        expect(document.querySelector('[data-integration-section="settings"]')).not.toBeNull();
    });

    it('renders a connection summary strip when provided', () => {
        renderWithRouter(
            <IntegrationPageLayout
                kind="webhooks"
                title="Webhooks"
                description="Notify services"
                enabled
                summary={<span data-testid="summary-chip">https://hooks.example</span>}
            >
                <div />
            </IntegrationPageLayout>
        );

        expect(document.querySelector('[data-integration-summary="webhooks"]')).not.toBeNull();
        expect(screen.getByTestId('summary-chip')).toHaveTextContent('https://hooks.example');
    });

    it('IntegrationPageShell provides back control for loading states', () => {
        renderWithRouter(
            <IntegrationPageShell>
                <div data-testid="loading">…</div>
            </IntegrationPageShell>
        );

        expect(document.querySelector('[data-integration-back]')).not.toBeNull();
        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
});

describe('IntegrationAboutSection', () => {
    it('starts collapsed and expands to show reference items', async () => {
        const user = userEvent.setup();

        renderWithRouter(
            <IntegrationAboutSection
                title="How it works"
                description="Secondary reference"
                items={['Signed requests', 'Metadata only']}
            />
        );

        const details = document.querySelector('[data-integration-section="about"]') as HTMLDetailsElement | null;
        expect(details).not.toBeNull();
        expect(details?.open).toBe(false);

        await user.click(document.querySelector('[data-integration-about-toggle="true"]') as HTMLElement);

        expect(details?.open).toBe(true);
        expect(screen.getByText('Signed requests')).toBeInTheDocument();
        expect(screen.getByText('Metadata only')).toBeInTheDocument();
        expect(document.querySelector('[data-integration-permissions="true"]')).not.toBeNull();
    });
});

describe('IntegrationCard', () => {
    it('renders as a distinct card with status and configure link', () => {
        renderWithRouter(
            <IntegrationCard
                kind="webhooks"
                title="Webhooks"
                description="Notify external services"
                configured={false}
                configuredLabel="Enabled"
                notConfiguredLabel="Not enabled"
                actionLabel="Configure"
                configureHref="/integrations/webhooks"
            />,
            '/integrations'
        );

        const card = document.querySelector('[data-integration-card="webhooks"]') as HTMLElement | null;
        expect(card).not.toBeNull();
        expect(card?.className).toMatch(/rounded/);
        expect(card?.className).toMatch(/border/);
        expect(within(card!).getByText('Webhooks')).toBeInTheDocument();
        expect(within(card!).getByText('Notify external services')).toBeInTheDocument();
        expect(within(card!).getByText('Not enabled')).toBeInTheDocument();

        const link = within(card!).getByRole('link', { name: 'Configure' });
        expect(link).toHaveAttribute('href', '/integrations/webhooks');
    });

    it('shows enabled status when configured', () => {
        renderWithRouter(
            <IntegrationCard
                kind="unsplash"
                title="Unsplash"
                description="Stock photos"
                configured
                configuredLabel="Enabled"
                notConfiguredLabel="Not enabled"
                actionLabel="Configure"
                configureHref="/integrations/unsplash"
            />,
            '/integrations'
        );

        const card = document.querySelector('[data-integration-card="unsplash"]') as HTMLElement | null;
        expect(card).not.toBeNull();
        expect(within(card!).getByText('Enabled')).toBeInTheDocument();
        expect(within(card!).getByRole('link', { name: 'Configure' })).toHaveAttribute(
            'href',
            '/integrations/unsplash'
        );
    });

    it('covers all three integration kinds with correct configure hrefs', () => {
        const kinds = [
            { kind: 'unsplash' as const, href: '/integrations/unsplash', title: 'Unsplash' },
            { kind: 'ai' as const, href: '/integrations/ai', title: 'AI writing' },
            { kind: 'webhooks' as const, href: '/integrations/webhooks', title: 'Webhooks' },
        ];

        renderWithRouter(
            <div data-integrations-cards="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {kinds.map((item) => (
                    <IntegrationCard
                        key={item.kind}
                        kind={item.kind}
                        title={item.title}
                        description={`${item.title} help`}
                        configured={false}
                        configuredLabel="Enabled"
                        notConfiguredLabel="Not enabled"
                        actionLabel="Configure"
                        configureHref={item.href}
                    />
                ))}
            </div>,
            '/integrations'
        );

        const grid = document.querySelector('[data-integrations-cards="true"]') as HTMLElement | null;
        expect(grid).not.toBeNull();
        expect(grid?.className).toMatch(/grid/);
        // Not a single divided row stack
        expect(grid?.className).not.toMatch(/divide-y/);

        for (const item of kinds) {
            const card = document.querySelector(`[data-integration-card="${item.kind}"]`) as HTMLElement | null;
            expect(card).not.toBeNull();
            expect(within(card!).getByText(item.title)).toBeInTheDocument();
        }

        const links = within(grid!).getAllByRole('link', { name: 'Configure' });
        expect(links).toHaveLength(3);
        expect(links.map((link) => link.getAttribute('href'))).toEqual([
            '/integrations/unsplash',
            '/integrations/ai',
            '/integrations/webhooks',
        ]);
    });
});

describe('IntegrationsListSkeleton', () => {
    it('mirrors the card grid geometry, not a divided row list', () => {
        render(<IntegrationsListSkeleton rows={3} />);

        const skeleton = document.querySelector('[data-integrations-list-skeleton="true"]');
        expect(skeleton).not.toBeNull();
        expect(skeleton?.className).toMatch(/grid/);
        expect(skeleton?.className).not.toMatch(/divide-y/);
        expect(document.querySelector('[data-integrations-cards-skeleton="true"]')).not.toBeNull();

        // Three card-shaped placeholders
        const cards = skeleton?.querySelectorAll(':scope > div');
        expect(cards?.length).toBe(3);
    });
});
