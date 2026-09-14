import type { ReactNode } from 'react';

import { Badge } from '@/components/badge';
import { IntegrationIcon, type IntegrationKind } from '@/components/integrations/IntegrationIcon';
import type { IntegrationConnectionStatus } from '@/lib/api/integrations';
import { cn } from '@/lib/utils';

type IntegrationCardProps = {
    kind: IntegrationKind;
    title: string;
    description: string;
    status?: IntegrationConnectionStatus;
    configuredLabel: string;
    notConfiguredLabel: string;
    actionLabel: string;
    onClick: () => void;
    selected?: boolean;
    meta?: ReactNode;
    className?: string;
};

export function IntegrationCard({
    kind,
    title,
    description,
    status = 'off',
    configuredLabel,
    notConfiguredLabel,
    actionLabel,
    onClick,
    selected = false,
    meta,
    className,
}: IntegrationCardProps) {
    return (
        <button
            type="button"
            className={cn(
                'group flex h-full w-full cursor-pointer flex-col rounded-xl border border-zinc-950/10 bg-white p-4 text-left shadow-sm transition-all',
                'hover:border-zinc-950/15 hover:shadow-md dark:border-white/10 dark:bg-white/[0.02] dark:shadow-none',
                'dark:ring-1 dark:ring-white/5 dark:hover:border-white/15 dark:hover:bg-white/[0.04]',
                'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                selected && 'border-zinc-950/20 bg-zinc-950/[0.03] dark:border-white/20 dark:bg-white/[0.06]',
                className
            )}
            data-integration-card={kind}
            data-integration-row={kind}
            data-integration-status={status}
            data-selected={selected ? 'true' : undefined}
            aria-haspopup="dialog"
            aria-expanded={selected}
            aria-label={`${actionLabel} ${title}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2">
                <IntegrationIcon kind={kind} size="sm" />
                <Badge color={status === 'enabled' ? 'green' : 'zinc'}>
                    {status === 'enabled' ? configuredLabel : notConfiguredLabel}
                </Badge>
            </div>

            <div className="mt-3 min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-950 dark:text-white">{title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-canvas-muted dark:text-canvas-muted-dark">
                    {description}
                </span>
                {meta ? <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{meta}</span> : null}
            </div>

            <div className="mt-4">
                <span className="inline-flex items-center justify-center rounded-lg border border-zinc-950/10 px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] text-sm/6 font-semibold text-zinc-950 dark:border-white/15 dark:text-white">
                    {actionLabel}
                </span>
            </div>
        </button>
    );
}
