import clsx from 'clsx';
import type { ReactNode } from 'react';

type KbdProps = {
    children: ReactNode;
    className?: string;
};

export function Kbd({ children, className }: KbdProps) {
    return (
        <kbd
            className={clsx(
                'inline-flex h-5 min-w-5 items-center justify-center rounded border border-zinc-200 bg-white px-1 font-sans text-[0.625rem]/4 font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400',
                className
            )}
        >
            {children}
        </kbd>
    );
}

type KbdGroupProps = {
    keys: string[];
    className?: string;
};

export function KbdGroup({ keys, className }: KbdGroupProps) {
    return (
        <span className={clsx('inline-flex items-center gap-0.5', className)}>
            {keys.map((key, index) => (
                <Kbd key={`${key}-${index}`}>{key}</Kbd>
            ))}
        </span>
    );
}
