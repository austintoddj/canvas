import type { ReactNode } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { IntegrationIcon, type IntegrationKind } from '@/components/integrations/IntegrationIcon';
import { Text } from '@/components/text';
import { cn } from '@/lib/utils';

type IntegrationCardProps = {
    kind: IntegrationKind;
    title: string;
    description: string;
    configured: boolean;
    configuredLabel: string;
    notConfiguredLabel: string;
    actionLabel: string;
    configureHref: string;
    meta?: ReactNode;
    className?: string;
};

export function IntegrationCard({
    kind,
    title,
    description,
    configured,
    configuredLabel,
    notConfiguredLabel,
    actionLabel,
    configureHref,
    meta,
    className,
}: IntegrationCardProps) {
    return (
        <div
            className={cn(
                'group flex h-full flex-col rounded-2xl border border-zinc-950/10 bg-white p-5 shadow-sm transition-all',
                'hover:border-zinc-950/15 hover:shadow-md dark:border-white/10 dark:bg-white/[0.02] dark:shadow-none',
                'dark:ring-1 dark:ring-white/5 dark:hover:border-white/15 dark:hover:bg-white/[0.04]',
                className
            )}
            data-integration-card={kind}
            data-integration-row={kind}
        >
            <div className="flex items-start justify-between gap-3">
                <IntegrationIcon kind={kind} size="md" />
                <Badge color={configured ? 'green' : 'zinc'}>{configured ? configuredLabel : notConfiguredLabel}</Badge>
            </div>

            <div className="mt-4 min-w-0 flex-1">
                <Text className="text-base font-semibold text-zinc-950 dark:text-white">{title}</Text>
                <Text className="mt-1.5 text-sm leading-relaxed text-canvas-muted dark:text-canvas-muted-dark">
                    {description}
                </Text>
                {meta ? <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{meta}</Text> : null}
            </div>

            <div className="mt-5">
                <Button href={configureHref} outline className="w-full sm:w-auto">
                    {actionLabel}
                </Button>
            </div>
        </div>
    );
}
