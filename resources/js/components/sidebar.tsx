import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import { LayoutGroup, motion } from 'motion/react';
import React, { forwardRef, useId, type ReactNode } from 'react';

import { useSidebarChrome } from '@/contexts/SidebarChromeContext';
import { Tooltip } from '@/components/tooltip';

import { TouchTarget } from './button';
import { Link } from './link';

export function Sidebar({ className, ...props }: React.ComponentPropsWithoutRef<'nav'>) {
    const { rail } = useSidebarChrome();

    return (
        <nav
            {...props}
            data-sidebar-rail={rail ? 'true' : undefined}
            className={clsx(className, 'flex h-full min-h-0 flex-col')}
        />
    );
}

export function SidebarHeader({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    const { rail } = useSidebarChrome();

    return (
        <div
            {...props}
            className={clsx(
                className,
                'flex flex-col border-b border-zinc-950/5 dark:border-white/5',
                // No horizontal padding in rail — active bar pins to the true left edge
                rail
                    ? 'py-2 [&>[data-slot=section]+[data-slot=section]]:mt-1.5'
                    : 'p-4 [&>[data-slot=section]+[data-slot=section]]:mt-2.5'
            )}
        />
    );
}

export function SidebarBody({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    const { rail } = useSidebarChrome();

    return (
        <div
            {...props}
            className={clsx(
                className,
                'flex flex-1 flex-col overflow-y-auto overflow-x-hidden',
                rail
                    ? 'py-1 [&>[data-slot=section]+[data-slot=section]]:mt-3'
                    : 'p-4 [&>[data-slot=section]+[data-slot=section]]:mt-8'
            )}
        />
    );
}

export function SidebarFooter({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    const { rail } = useSidebarChrome();

    return (
        <div
            {...props}
            className={clsx(
                className,
                'flex flex-col border-t border-zinc-950/5 dark:border-white/5',
                rail
                    ? 'items-center gap-0.5 py-2 [&>[data-slot=section]+[data-slot=section]]:mt-1.5'
                    : 'p-4 [&>[data-slot=section]+[data-slot=section]]:mt-2.5'
            )}
        />
    );
}

export function SidebarSection({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    const id = useId();

    return (
        <LayoutGroup id={id}>
            <div {...props} data-slot="section" className={clsx(className, 'flex w-full flex-col gap-0.5')} />
        </LayoutGroup>
    );
}

export function SidebarDivider({ className, ...props }: React.ComponentPropsWithoutRef<'hr'>) {
    return (
        <hr {...props} className={clsx(className, 'my-4 border-t border-zinc-950/5 lg:-mx-4 dark:border-white/5')} />
    );
}

export function SidebarSpacer({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    return <div aria-hidden="true" {...props} className={clsx(className, 'mt-8 flex-1')} />;
}

export function SidebarHeading({ className, children, ...props }: React.ComponentPropsWithoutRef<'h3'>) {
    const { rail } = useSidebarChrome();

    if (rail) {
        return null;
    }

    return (
        <h3
            {...props}
            className={clsx(className, 'mb-1 px-2 text-xs/6 font-medium text-canvas-muted dark:text-canvas-muted-dark')}
        >
            {children}
        </h3>
    );
}

type SidebarItemOwnProps = {
    current?: boolean;
    className?: string;
    children: React.ReactNode;
    /** Tip content — shown in rail mode, or always when `tooltipAlways`. */
    tooltip?: ReactNode;
    /** Show tooltip even when the sidebar is expanded. */
    tooltipAlways?: boolean;
};

export const SidebarItem = forwardRef(function SidebarItem(
    {
        current,
        className,
        children,
        tooltip,
        tooltipAlways = false,
        ...props
    }: SidebarItemOwnProps &
        (
            | ({ href?: never } & Omit<Headless.ButtonProps, 'as' | 'className'>)
            | ({ href: string } & Omit<Headless.ButtonProps<typeof Link>, 'as' | 'className'>)
        ),
    ref: React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>
) {
    const { rail } = useSidebarChrome();

    const classes = clsx(
        'flex cursor-pointer items-center rounded-lg text-left text-base/6 font-medium text-zinc-950 sm:text-sm/5 data-disabled:cursor-not-allowed',
        rail ? 'size-9 shrink-0 justify-center gap-0 p-0 sm:size-9' : 'w-full gap-3 px-2 py-2.5 sm:py-2',
        '*:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:text-zinc-500',
        !rail && '*:data-[slot=icon]:size-6 sm:*:data-[slot=icon]:size-5',
        '*:last:data-[slot=icon]:ml-auto *:last:data-[slot=icon]:size-5 sm:*:last:data-[slot=icon]:size-4',
        rail && '*:last:data-[slot=icon]:ml-0',
        '*:data-[slot=shortcut]:ml-auto',
        '*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-7 sm:*:data-[slot=avatar]:size-6',
        rail && '*:data-[slot=avatar]:m-0 *:data-[slot=avatar]:size-7',
        'data-hover:bg-zinc-950/5 data-hover:*:data-[slot=icon]:text-zinc-950',
        'data-active:bg-zinc-950/5 data-active:*:data-[slot=icon]:text-zinc-950',
        'data-current:*:data-[slot=icon]:text-zinc-950',
        'dark:text-white dark:*:data-[slot=icon]:text-zinc-400',
        'dark:data-hover:bg-white/5 dark:data-hover:*:data-[slot=icon]:text-white',
        'dark:data-active:bg-white/5 dark:data-active:*:data-[slot=icon]:text-white',
        'dark:data-current:*:data-[slot=icon]:text-white'
    );

    const control =
        typeof props.href === 'string' ? (
            <Headless.CloseButton
                as={Link}
                {...props}
                className={classes}
                data-current={current ? 'true' : undefined}
                ref={ref}
            >
                <TouchTarget>{children}</TouchTarget>
            </Headless.CloseButton>
        ) : (
            <Headless.Button {...props} className={classes} data-current={current ? 'true' : undefined} ref={ref}>
                <TouchTarget>{children}</TouchTarget>
            </Headless.Button>
        );

    // Full-width row so the active bar can pin to the sidebar edge; square control centers itself.
    const item = (
        <span className={clsx(className, 'relative block w-full', rail && 'flex justify-center')}>
            {current && (
                <motion.span
                    layoutId="current-indicator"
                    className={clsx(
                        'absolute inset-y-2 w-0.5 rounded-full bg-zinc-950 dark:bg-white',
                        // Expanded: offset past p-4. Rail: flush to left (no horizontal padding).
                        rail ? 'left-0' : '-left-4'
                    )}
                />
            )}
            {control}
        </span>
    );

    // Only mount Tooltip when visible — avoids wrappers shrinking expanded rows.
    const showTooltip = tooltip != null && (tooltipAlways || rail);

    if (showTooltip) {
        return (
            <Tooltip content={tooltip} placement="right" triggerClassName="block w-full">
                {item}
            </Tooltip>
        );
    }

    return item;
});

export function SidebarLabel({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) {
    const { rail } = useSidebarChrome();

    if (rail) {
        return <span {...props} className="sr-only" />;
    }

    // flex-1 so the label fills remaining row width (full-row hover like Recent Posts).
    return <span {...props} className={clsx(className, 'min-w-0 flex-1 truncate')} />;
}

export function SidebarShortcut({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) {
    const { rail } = useSidebarChrome();

    if (rail) {
        return null;
    }

    return (
        <span
            data-slot="shortcut"
            {...props}
            className={clsx(
                className,
                'ml-auto hidden shrink-0 gap-0.5 text-[0.625rem]/4 font-medium text-zinc-400 sm:inline-flex dark:text-zinc-500'
            )}
        />
    );
}
