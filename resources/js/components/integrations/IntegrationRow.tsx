import type { ReactNode } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { IntegrationIcon, type IntegrationKind } from '@/components/integrations/IntegrationIcon';
import { Text } from '@/components/text';
import { cn } from '@/lib/utils';

type IntegrationRowProps = {
    kind: IntegrationKind;
    title: string;
    description: string;
    configured: boolean;
    configuredLabel: string;
    notConfiguredLabel: string;
    actionLabel: string;
    meta?: ReactNode;
    onConfigure: () => void;
    className?: string;
};

export function IntegrationRow({
    kind,
    title,
    description,
    configured,
    configuredLabel,
    notConfiguredLabel,
    actionLabel,
    meta,
    onConfigure,
    className,
}: IntegrationRowProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-3 px-4 py-3.5 transition-colors sm:gap-4 sm:px-5',
                'hover:bg-zinc-950/[0.02] dark:hover:bg-white/[0.03]',
                className
            )}
            data-integration-row={kind}
        >
            <IntegrationIcon kind={kind} />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Text className="truncate text-sm font-semibold text-zinc-950 dark:text-white">{title}</Text>
                    <Badge color={configured ? 'green' : 'zinc'}>
                        {configured ? configuredLabel : notConfiguredLabel}
                    </Badge>
                </div>
                <Text className="mt-0.5 line-clamp-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                    {description}
                </Text>
                {meta ? (
                    <Text className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">{meta}</Text>
                ) : null}
            </div>

            <Button type="button" outline className="shrink-0" onClick={onConfigure}>
                {actionLabel}
            </Button>
        </div>
    );
}
