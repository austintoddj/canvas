import type { ReactNode } from 'react';

import { Badge } from '@/components/badge';
import { Divider } from '@/components/divider';
import { Subheading } from '@/components/heading';
import { IntegrationIcon, type IntegrationKind } from '@/components/integrations/IntegrationIcon';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { IntegrationDeveloper } from '@/lib/integrations/ai-providers';
import { IconCheck, IconClock } from '@tabler/icons-react';

const developerLinkClass =
    'font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400';

type IntegrationDrawerChromeProps = {
    kind: IntegrationKind;
    title: string;
    description: string;
    enabled: boolean;
    enabledAt?: string | null;
    developer?: IntegrationDeveloper | null;
    /** Callouts above settings (API key scope for Unsplash/AI; delivery behavior for webhooks). */
    permissions: string[];
    /** Override section heading (default: Permissions). */
    permissionsTitle?: string;
    /** Override section help (default: How this key is used.). */
    permissionsHelp?: string;
    icon?: ReactNode;
    children: ReactNode;
    dangerZone?: ReactNode;
};

export function IntegrationDrawerChrome({
    kind,
    title,
    description,
    enabled,
    enabledAt = null,
    developer = null,
    permissions,
    permissionsTitle,
    permissionsHelp,
    icon,
    children,
    dangerZone,
}: IntegrationDrawerChromeProps) {
    const { t } = useCanvas();
    const relative = enabled ? formatRelativeTime(enabledAt) : null;
    const enabledAgo = relative === null ? null : t('integrations.enabled_ago', { relative }, 'Enabled :relative');
    const developedByPrefix = t('integrations.developed_by_prefix', 'Developed by');
    const detailsTitle = permissionsTitle ?? t('integrations.permissions', 'Permissions');
    const detailsHelp = permissionsHelp ?? t('integrations.permissions_help', 'How this key is used.');

    return (
        <div className="min-w-0 space-y-6 px-5 py-5" data-integration-drawer={kind}>
            <div className="flex min-w-0 gap-3">
                <div className="shrink-0">{icon ?? <IntegrationIcon kind={kind} size="md" />}</div>
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <Text className="truncate text-base font-semibold text-zinc-950 dark:text-white">{title}</Text>
                        <Badge color={enabled ? 'green' : 'zinc'}>
                            {enabled
                                ? t('integrations.enabled', 'Enabled')
                                : t('integrations.not_enabled', 'Not enabled')}
                        </Badge>
                    </div>
                    <Text className="text-sm text-balance text-canvas-muted dark:text-canvas-muted-dark">
                        {description}
                    </Text>
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

            {permissions.length > 0 ? (
                <section className="min-w-0 space-y-2" data-integration-permissions="true">
                    <Subheading level={3}>{detailsTitle}</Subheading>
                    <Text className="text-xs text-canvas-muted dark:text-canvas-muted-dark">{detailsHelp}</Text>
                    <ul className="divide-y divide-zinc-950/5 dark:divide-white/5">
                        {permissions.map((permission) => (
                            <li key={permission} className="flex min-w-0 gap-2 py-2 first:pt-0 last:pb-0">
                                <IconCheck
                                    className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                                    aria-hidden="true"
                                />
                                <span className="min-w-0 text-sm leading-5 text-zinc-700 dark:text-zinc-300">
                                    {permission}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            <Divider soft />

            <section className="min-w-0 space-y-3" data-integration-settings="true">
                <Subheading level={3}>{t('integrations.settings', 'Settings')}</Subheading>
                <div className="min-w-0">{children}</div>
            </section>

            {dangerZone ? (
                <>
                    <Divider soft />
                    <section
                        className="min-w-0 space-y-3 rounded-lg border border-red-500/25 p-3.5 dark:border-red-400/30"
                        data-integration-danger-zone="true"
                    >
                        <h3 className="text-sm/6 font-semibold text-red-600 dark:text-red-400">
                            {t('integrations.danger_zone', 'Danger zone')}
                        </h3>
                        {dangerZone}
                    </section>
                </>
            ) : null}
        </div>
    );
}
