import clsx from 'clsx';
import type { ReactNode } from 'react';

import { Text } from '@/components/text';

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
            className={clsx(
                className,
                'relative overflow-hidden rounded-3xl border border-zinc-950/10 bg-gradient-to-b from-zinc-950/[0.02] to-transparent px-6 py-14 text-center sm:px-10',
                'dark:border-white/10 dark:from-white/[0.06] dark:to-white/[0.01] dark:ring-1 dark:ring-white/5'
            )}
            data-empty-state="true"
        >
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(147,197,253,0.14),transparent_58%)]"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(ellipse_at_bottom,rgba(167,139,250,0.06),transparent_50%)]"
                aria-hidden="true"
            />

            <div className="relative mx-auto flex max-w-lg flex-col items-center">
                {visual ? <div className="mb-8">{visual}</div> : null}

                <h2 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
                    {headline}
                </h2>
                <Text className="mt-3 text-pretty text-sm text-zinc-500 dark:text-zinc-400">{description}</Text>
                {action ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{action}</div> : null}
            </div>
        </div>
    );
}
