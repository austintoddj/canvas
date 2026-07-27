import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import { LayoutGroup, motion } from 'motion/react';
import React, { forwardRef, useId } from 'react';
import { TouchTarget } from './button';
import { Link } from './link';

export function Navbar({ className, ...props }: React.ComponentPropsWithoutRef<'nav'>) {
    return <nav {...props} className={clsx(className, 'flex flex-1 items-center gap-4 py-2.5')} />;
}

export function NavbarDivider({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    return (
        <div aria-hidden="true" {...props} className={clsx(className, 'h-6 w-px bg-zinc-950/10 dark:bg-white/10')} />
    );
}

export function NavbarSection({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    const id = useId();

    return (
        <LayoutGroup id={id}>
            <div {...props} className={clsx(className, 'flex items-center gap-3')} />
        </LayoutGroup>
    );
}

export function NavbarSpacer({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    return <div aria-hidden="true" {...props} className={clsx(className, '-ml-4 flex-1')} />;
}

export const NavbarItem = forwardRef(function NavbarItem(
    {
        current,
        className,
        children,
        ...props
    }: { current?: boolean; className?: string; children: React.ReactNode } & (
        | ({ href?: never } & Omit<Headless.ButtonProps, 'as' | 'className'>)
        | ({ href: string } & Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>)
    ),
    ref: React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>
) {
    const classes = clsx(
        'relative flex min-w-0 cursor-pointer items-center gap-3 rounded-lg p-2 text-left text-base/6 font-medium text-zinc-950 sm:text-sm/5 data-disabled:cursor-not-allowed',
        '*:data-[slot=icon]:size-6 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:text-zinc-500 sm:*:data-[slot=icon]:size-5',
        '*:not-nth-2:last:data-[slot=icon]:ml-auto *:not-nth-2:last:data-[slot=icon]:size-5 sm:*:not-nth-2:last:data-[slot=icon]:size-4',
        '*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-7 *:data-[slot=avatar]:[--avatar-radius:var(--radius-md)] sm:*:data-[slot=avatar]:size-6',
        'data-hover:bg-zinc-950/5 data-hover:*:data-[slot=icon]:text-zinc-950',
        'data-active:bg-zinc-950/5 data-active:*:data-[slot=icon]:text-zinc-950',
        'dark:text-white dark:*:data-[slot=icon]:text-zinc-400',
        'dark:data-hover:bg-white/5 dark:data-hover:*:data-[slot=icon]:text-white',
        'dark:data-active:bg-white/5 dark:data-active:*:data-[slot=icon]:text-white'
    );

    return (
        <span className={clsx(className, 'relative')}>
            {current && (
                <motion.span
                    layoutId="current-indicator"
                    className="absolute inset-x-2 -bottom-2.5 h-0.5 rounded-full bg-zinc-950 dark:bg-white"
                />
            )}
            {typeof props.href === 'string' ? (
                <Link
                    {...props}
                    className={classes}
                    data-current={current ? 'true' : undefined}
                    ref={ref as React.ForwardedRef<HTMLAnchorElement>}
                >
                    <TouchTarget>{children}</TouchTarget>
                </Link>
            ) : (
                <Headless.Button {...props} className={classes} data-current={current ? 'true' : undefined} ref={ref}>
                    <TouchTarget>{children}</TouchTarget>
                </Headless.Button>
            )}
        </span>
    );
});

export function NavbarLabel({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) {
    return <span {...props} className={clsx(className, 'truncate')} />;
}
