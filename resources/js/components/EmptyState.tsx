import type { ReactNode } from 'react';

import { Text } from '@/components/text';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
    headline: string;
    description: string;
    action?: ReactNode;
    visual?: ReactNode;
    className?: string;
};

export function EmptyState({ headline, description, action, visual, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                className,
                'rounded-2xl border border-canvas-border bg-canvas-panel px-6 py-10 text-center',
                'dark:border-canvas-border-dark dark:bg-canvas-panel-dark'
            )}
            data-empty-state="true"
        >
            <div className="mx-auto flex max-w-lg flex-col items-center">
                {visual ? <div className="mb-8">{visual}</div> : null}

                <h2 className="text-xl font-semibold tracking-tight text-canvas-fg dark:text-canvas-fg-dark">
                    {headline}
                </h2>
                <Text className="mt-3 text-pretty text-sm">{description}</Text>
                {action ? <div className="mt-8 w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">{action}</div> : null}
            </div>
        </div>
    );
}
