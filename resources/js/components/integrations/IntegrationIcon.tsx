import { PhotoIcon, SparklesIcon } from '@heroicons/react/20/solid';
import type { ComponentType, SVGProps } from 'react';

import { cn } from '@/lib/utils';

export type IntegrationKind = 'unsplash' | 'ai';

const tileStyles: Record<IntegrationKind, string> = {
    unsplash:
        'bg-gradient-to-br from-sky-500/15 via-indigo-500/10 to-violet-500/10 ring-sky-500/10 dark:from-sky-400/20 dark:via-indigo-400/15 dark:to-violet-400/10 dark:ring-white/10',
    ai: 'bg-gradient-to-br from-violet-500/15 via-indigo-500/10 to-fuchsia-500/10 ring-violet-500/10 dark:from-violet-400/20 dark:via-indigo-400/15 dark:to-fuchsia-400/10 dark:ring-white/10',
};

const iconStyles: Record<IntegrationKind, string> = {
    unsplash: 'text-sky-600 dark:text-sky-400',
    ai: 'text-violet-600 dark:text-violet-400',
};

const iconByKind: Record<IntegrationKind, ComponentType<SVGProps<SVGSVGElement>>> = {
    unsplash: PhotoIcon,
    ai: SparklesIcon,
};

type IntegrationIconProps = {
    kind: IntegrationKind;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
};

const tileSizeClass: Record<NonNullable<IntegrationIconProps['size']>, string> = {
    sm: 'size-11 rounded-xl',
    md: 'size-12 rounded-xl',
    lg: 'size-20 rounded-2xl',
};

const iconSizeClass: Record<NonNullable<IntegrationIconProps['size']>, string> = {
    sm: 'size-6',
    md: 'size-7',
    lg: 'size-10',
};

export function IntegrationIcon({ kind, size = 'sm', className }: IntegrationIconProps) {
    const Icon = iconByKind[kind];

    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center justify-center ring-1 ring-inset',
                tileSizeClass[size],
                tileStyles[kind],
                className
            )}
            aria-hidden="true"
            data-integration-icon={kind}
        >
            <Icon className={cn(iconSizeClass[size], iconStyles[kind])} />
        </span>
    );
}
