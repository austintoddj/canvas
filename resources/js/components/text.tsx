import type React from 'react';

import { Link } from './link';
import { cn } from '@/lib/utils';

export function Text({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) {
    return (
        <p
            data-slot="text"
            {...props}
            className={cn('text-base/6 text-canvas-muted sm:text-sm/6 dark:text-canvas-muted-dark', className)}
        />
    );
}

/** PageHeader subtitle — one line under the title. */
export function PageDescription({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) {
    return (
        <p
            data-slot="page-description"
            {...props}
            className={cn('mt-1 text-sm text-canvas-muted dark:text-canvas-muted-dark', className)}
        />
    );
}

/** Form/list error line. */
export function ErrorText({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) {
    return (
        <p
            data-slot="error-text"
            role="alert"
            {...props}
            className={cn('text-sm text-canvas-danger dark:text-canvas-danger-dark', className)}
        />
    );
}

export function TextLink({ className, ...props }: React.ComponentPropsWithoutRef<typeof Link>) {
    return (
        <Link
            {...props}
            className={cn(
                'text-zinc-950 underline decoration-zinc-950/50 data-hover:decoration-zinc-950 dark:text-white dark:decoration-white/50 dark:data-hover:decoration-white',
                className
            )}
        />
    );
}

export function Strong({ className, ...props }: React.ComponentPropsWithoutRef<'strong'>) {
    return <strong {...props} className={cn('font-medium text-zinc-950 dark:text-white', className)} />;
}

export function Code({ className, ...props }: React.ComponentPropsWithoutRef<'code'>) {
    return (
        <code
            {...props}
            className={cn(
                'rounded-sm border border-zinc-950/10 bg-zinc-950/2.5 px-0.5 text-sm font-medium text-zinc-950 sm:text-[0.8125rem] dark:border-white/20 dark:bg-white/5 dark:text-white',
                className
            )}
        />
    );
}
