import { useState, type ReactNode, type SyntheticEvent } from 'react';
import { IconArrowLeft, IconChevronDown, IconClock } from '@tabler/icons-react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Heading } from '@/components/heading';
import { IntegrationIcon, type IntegrationKind } from '@/components/integrations/IntegrationIcon';
import { PageDescription, Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { IntegrationConnectionStatus } from '@/lib/api/integrations';
import type { IntegrationDeveloper } from '@/lib/integrations/ai-providers';
import { cn } from '@/lib/utils';

const developerLinkClass =
    'font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400';

type IntegrationPageShellProps = {
    children: ReactNode;
    className?: string;
};

/** Shared width + back control for integration detail routes (including loading/error). */
export function IntegrationPageShell({ children, className }: IntegrationPageShellProps) {
    const { t } = useCanvas();

    return (
        <div className={cn('space-y-8', className)} data-integration-page="true">
            <div>
                <Button href="/integrations" plain data-integration-back>
                    <IconArrowLeft data-slot="icon" />
                    {t('integrations.title')}
                </Button>
            </div>
            {children}
        </div>
    );
}

type IntegrationPageLayoutProps = {
    kind: IntegrationKind;
    title: string;
    description: string;
    status?: IntegrationConnectionStatus;
    enabled?: boolean;
    enabledAt?: string | null;
    developer?: IntegrationDeveloper | null;
    /** Compact connection facts under the hero (endpoint, provider, key). */
    summary?: ReactNode;
    icon?: ReactNode;
    children: ReactNode;
};

/**
 * Page shell for an integration detail screen.
 *
 * IA (top → bottom):
 * 1. Back to list
 * 2. Identity hero (what / status / why) + optional connection summary
 * 3. Section stack from children (settings → ops → about → danger)
 */
export function IntegrationPageLayout({
    kind,
    title,
    description,
    status,
    enabled = false,
    enabledAt = null,
    developer = null,
    summary = null,
    icon,
    children,
}: IntegrationPageLayoutProps) {
    const { t } = useCanvas();
    const connectionStatus: IntegrationConnectionStatus = status ?? (enabled ? 'enabled' : 'off');
    const relative = connectionStatus === 'enabled' ? formatRelativeTime(enabledAt) : null;
    const enabledAgo = relative === null ? null : t('integrations.enabled_ago', { relative }, 'Enabled :relative');
    const statusLabel =
        connectionStatus === 'enabled'
            ? t('integrations.enabled', 'Enabled')
            : t('integrations.not_enabled', 'Not enabled');
    const developedByPrefix = t('integrations.developed_by_prefix', 'Developed by');

    return (
        <IntegrationPageShell>
            <header className="min-w-0 space-y-3" data-integration-hero={kind}>
                <div className="flex min-w-0 gap-4">
                    <div className="shrink-0">{icon ?? <IntegrationIcon kind={kind} size="lg" />}</div>
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
                            <Heading className="min-w-0 truncate">{title}</Heading>
                            <Badge
                                color={connectionStatus === 'enabled' ? 'green' : 'zinc'}
                                data-integration-status={connectionStatus}
                            >
                                {statusLabel}
                            </Badge>
                        </div>
                        <PageDescription className="mt-0 max-w-2xl text-balance">{description}</PageDescription>
                        {enabledAgo || developer ? (
                            <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                                {enabledAgo ? (
                                    <span className="inline-flex items-center gap-1">
                                        <IconClock className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
                                        <span>{enabledAgo}</span>
                                    </span>
                                ) : null}
                                {enabledAgo && developer ? (
                                    <span className="text-zinc-300 dark:text-zinc-600" aria-hidden="true">
                                        ·
                                    </span>
                                ) : null}
                                {developer ? (
                                    <span className="min-w-0">
                                        {developedByPrefix}{' '}
                                        <a
                                            href={developer.websiteUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={developerLinkClass}
                                        >
                                            {developer.name}
                                        </a>
                                    </span>
                                ) : null}
                            </p>
                        ) : null}
                    </div>
                </div>

                {summary ? (
                    <div
                        className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border border-zinc-950/10 bg-zinc-950/[0.02] px-3.5 py-2.5 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-300"
                        data-integration-summary={kind}
                    >
                        {summary}
                    </div>
                ) : null}
            </header>

            <div className="space-y-5" data-integration-sections={kind}>
                {children}
            </div>
        </IntegrationPageShell>
    );
}

/** Dot separator for connection-summary chips. */
export function IntegrationSummarySep() {
    return (
        <span className="text-zinc-300 dark:text-zinc-600" aria-hidden="true">
            ·
        </span>
    );
}

type IntegrationSectionVariant = 'default' | 'muted' | 'caution' | 'danger';

type IntegrationSectionProps = {
    title?: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    /** Header trailing actions (e.g. refresh). */
    actions?: ReactNode;
    variant?: IntegrationSectionVariant;
    className?: string;
    'data-section'?: string;
};

const sectionVariantClass: Record<IntegrationSectionVariant, string> = {
    default: 'border-zinc-950/10 dark:border-white/10',
    muted: 'border-zinc-950/10 bg-zinc-950/[0.015] dark:border-white/10 dark:bg-white/[0.015]',
    caution: 'border-zinc-950/10 bg-zinc-950/[0.02] dark:border-white/10 dark:bg-white/[0.02]',
    danger: 'border-red-500/25 dark:border-red-400/30',
};

/**
 * One content card on an integration detail page.
 * Primary work (settings) uses default; reference copy uses muted; disconnect uses danger.
 */
export function IntegrationSection({
    title,
    description,
    children,
    footer,
    actions,
    variant = 'default',
    className,
    'data-section': dataSection,
}: IntegrationSectionProps) {
    const titleClass =
        variant === 'danger'
            ? 'text-sm/6 font-semibold text-red-600 dark:text-red-400'
            : 'text-base/7 font-semibold text-zinc-950 sm:text-sm/6 dark:text-white';

    const hasHeader = Boolean(title || description || actions);

    return (
        <section
            className={cn('min-w-0 overflow-hidden rounded-xl border', sectionVariantClass[variant], className)}
            data-integration-section={dataSection ?? variant}
        >
            {hasHeader ? (
                <div className="flex min-w-0 items-start justify-between gap-3 border-b border-zinc-950/5 px-5 py-3.5 dark:border-white/5">
                    <div className="min-w-0 space-y-0.5">
                        {title ? <h2 className={titleClass}>{title}</h2> : null}
                        {description ? (
                            <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">{description}</Text>
                        ) : null}
                    </div>
                    {actions ? <div className="shrink-0">{actions}</div> : null}
                </div>
            ) : null}
            <div className="min-w-0 px-5 py-4">{children}</div>
            {footer ? (
                <div className="flex flex-wrap gap-2 border-t border-zinc-950/5 bg-zinc-950/[0.015] px-5 py-3.5 dark:border-white/5 dark:bg-white/[0.02]">
                    {footer}
                </div>
            ) : null}
        </section>
    );
}

type IntegrationAboutSectionProps = {
    title: string;
    description?: string;
    items: string[];
    /** When true (default), about/permissions start collapsed. */
    defaultOpen?: boolean;
};

/**
 * Secondary reference list (permissions / how it works). Collapsed by default
 * so setup and ops stay above the fold.
 */
export function IntegrationAboutSection({
    title,
    description,
    items,
    defaultOpen = false,
}: IntegrationAboutSectionProps) {
    const [open, setOpen] = useState(defaultOpen);

    if (items.length === 0) {
        return null;
    }

    function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
        setOpen(event.currentTarget.open);
    }

    return (
        <details
            className={cn(
                'group min-w-0 overflow-hidden rounded-xl border border-zinc-950/10 bg-zinc-950/[0.015] dark:border-white/10 dark:bg-white/[0.015]',
                open && 'bg-zinc-950/[0.02] dark:bg-white/[0.02]'
            )}
            data-integration-section="about"
            open={open}
            onToggle={handleToggle}
        >
            <summary
                className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 marker:content-none [&::-webkit-details-marker]:hidden"
                data-integration-about-toggle="true"
            >
                <h2 className="min-w-0 text-base/7 font-semibold text-zinc-950 sm:text-sm/6 dark:text-white">
                    {title}
                </h2>
                <IconChevronDown
                    className={cn(
                        'size-4 shrink-0 text-zinc-400 transition-transform dark:text-zinc-500',
                        open && 'rotate-180'
                    )}
                    aria-hidden="true"
                />
            </summary>
            <div className="space-y-3 border-t border-zinc-950/5 px-5 py-4 dark:border-white/5">
                {description ? (
                    <p className="text-sm text-canvas-muted dark:text-canvas-muted-dark">{description}</p>
                ) : null}
                <ul className="divide-y divide-zinc-950/5 dark:divide-white/5" data-integration-permissions="true">
                    {items.map((item) => (
                        <li key={item} className="flex min-w-0 gap-2.5 py-2.5 first:pt-0 last:pb-0">
                            <span
                                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400"
                                aria-hidden="true"
                            />
                            <span className="min-w-0 text-sm leading-5 text-zinc-700 dark:text-zinc-300">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </details>
    );
}
