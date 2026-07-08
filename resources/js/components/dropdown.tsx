'use client';

import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import type React from 'react';
import { Button } from './button';
import { Link } from './link';

export function Dropdown(props: Headless.MenuProps) {
    return <Headless.Menu {...props} />;
}

export function DropdownButton<T extends React.ElementType = typeof Button>({
    as = Button,
    ...props
}: { className?: string } & Omit<Headless.MenuButtonProps<T>, 'className'>) {
    return <Headless.MenuButton as={as} {...props} />;
}

export function DropdownMenu({
    anchor = 'bottom',
    className,
    ...props
}: { className?: string } & Omit<Headless.MenuItemsProps, 'as' | 'className'>) {
    return (
        <Headless.MenuItems
            {...props}
            transition
            anchor={anchor}
            className={clsx(
                className,
                // Anchor positioning
                '[--anchor-gap:--spacing(2)] [--anchor-padding:--spacing(1)] data-[anchor~=end]:[--anchor-offset:6px] data-[anchor~=start]:[--anchor-offset:-6px] sm:data-[anchor~=end]:[--anchor-offset:4px] sm:data-[anchor~=start]:[--anchor-offset:-4px]',
                // Base styles
                'isolate w-max rounded-xl p-1',
                // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
                'outline outline-transparent focus:outline-hidden',
                // Handle scrolling when menu won't fit in viewport
                'overflow-y-auto',
                // Popover background
                'bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75',
                // Shadows
                'shadow-lg ring-1 ring-zinc-950/10 dark:ring-white/10 dark:ring-inset',
                // Define grid at the menu level if subgrid is supported
                'supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]',
                // Transitions
                'transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0'
            )}
        />
    );
}

export function DropdownItem({
    className,
    ...props
}: { className?: string } & (
    | ({ href?: never } & Omit<Headless.MenuItemProps<'button'>, 'as' | 'className'>)
    | ({ href: string } & Omit<Headless.MenuItemProps<typeof Link>, 'as' | 'className'>)
)) {
    const classes = clsx(
        className,
        // Base styles
        'group cursor-pointer rounded-lg px-3.5 py-2.5 focus:outline-hidden data-disabled:cursor-not-allowed sm:px-3 sm:py-1.5',
        // Text styles
        'text-left text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]',
        // Focus / hover (Headless UI uses data-focus for both)
        'data-focus:bg-zinc-950/5 data-focus:text-zinc-950 dark:data-focus:bg-white/10 dark:data-focus:text-white',
        // Disabled state
        'data-disabled:opacity-50',
        // Forced colors mode
        'forced-color-adjust-none forced-colors:data-focus:bg-[Highlight] forced-colors:data-focus:text-[HighlightText] forced-colors:data-focus:*:data-[slot=icon]:text-[HighlightText] forced-colors:data-focus:*:data-[slot=trailing-icon]:text-[HighlightText]',
        // Use subgrid when available but fallback to an explicit grid layout if not
        'col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] items-center supports-[grid-template-columns:subgrid]:grid-cols-subgrid',
        // Leading icons
        '*:data-[slot=icon]:col-start-1 *:data-[slot=icon]:row-start-1 *:data-[slot=icon]:mr-2.5 *:data-[slot=icon]:-ml-0.5 *:data-[slot=icon]:size-5 sm:*:data-[slot=icon]:mr-2 sm:*:data-[slot=icon]:size-4',
        '*:data-[slot=icon]:text-zinc-500 data-focus:*:data-[slot=icon]:text-zinc-700 dark:*:data-[slot=icon]:text-zinc-400 dark:data-focus:*:data-[slot=icon]:text-zinc-300',
        // Trailing icons
        '*:data-[slot=trailing-icon]:col-start-5 *:data-[slot=trailing-icon]:row-start-1 *:data-[slot=trailing-icon]:size-4 *:data-[slot=trailing-icon]:justify-self-end',
        '*:data-[slot=trailing-icon]:text-zinc-400 data-focus:*:data-[slot=trailing-icon]:text-zinc-500 dark:*:data-[slot=trailing-icon]:text-zinc-500 dark:data-focus:*:data-[slot=trailing-icon]:text-zinc-400',
        // Avatar (size comes from the Avatar className — do not force dimensions here)
        '*:data-[slot=avatar]:col-start-1 *:data-[slot=avatar]:row-start-1 *:data-[slot=avatar]:mr-2.5 *:data-[slot=avatar]:-ml-1 sm:*:data-[slot=avatar]:mr-2'
    );

    return typeof props.href === 'string' ? (
        <Headless.MenuItem as={Link} {...props} className={classes} />
    ) : (
        <Headless.MenuItem as="button" type="button" {...props} className={classes} />
    );
}

export function DropdownHeader({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    return <div {...props} className={clsx(className, 'col-span-5 px-3.5 pt-2.5 pb-1 sm:px-3')} />;
}

export function DropdownSection({
    className,
    ...props
}: { className?: string } & Omit<Headless.MenuSectionProps, 'as' | 'className'>) {
    return (
        <Headless.MenuSection
            {...props}
            className={clsx(
                className,
                // Define grid at the section level instead of the item level if subgrid is supported
                'col-span-full supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]'
            )}
        />
    );
}

export function DropdownHeading({
    className,
    ...props
}: { className?: string } & Omit<Headless.MenuHeadingProps, 'as' | 'className'>) {
    return (
        <Headless.MenuHeading
            {...props}
            className={clsx(
                className,
                'col-span-full grid grid-cols-[1fr_auto] gap-x-12 px-3.5 pt-2 pb-1 text-sm/5 font-medium text-zinc-500 sm:px-3 sm:text-xs/5 dark:text-zinc-400'
            )}
        />
    );
}

export function DropdownDivider({
    className,
    ...props
}: { className?: string } & Omit<Headless.MenuSeparatorProps, 'as' | 'className'>) {
    return (
        <Headless.MenuSeparator
            {...props}
            className={clsx(
                className,
                'col-span-full mx-3.5 my-1 h-px border-0 bg-zinc-950/5 sm:mx-3 dark:bg-white/10 forced-colors:bg-[CanvasText]'
            )}
        />
    );
}

/** Profile row — flex layout avoids subgrid column bleed from the avatar width. */
export const dropdownProfileItemClass = '!flex items-center gap-3';

/** Menu row without a leading icon/avatar — aligns with inset controls like the theme toggle. */
export const dropdownInsetItemClass =
    'grid-cols-[1fr_auto] supports-[grid-template-columns:subgrid]:grid-cols-[1fr_auto] *:data-[slot=trailing-icon]:col-start-2';

export function DropdownLabel({
    className,
    inset = false,
    ...props
}: { inset?: boolean } & React.ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            {...props}
            data-slot="label"
            className={clsx('row-start-1', inset ? 'col-start-1' : 'col-start-2', className)}
        />
    );
}

export function DropdownTrailingIcon({
    className,
    children,
    inset = false,
}: {
    className?: string;
    children: React.ReactNode;
    inset?: boolean;
}) {
    return (
        <span
            data-slot="trailing-icon"
            className={clsx('flex items-center', inset ? 'col-start-2 justify-self-end' : undefined, className)}
        >
            {children}
        </span>
    );
}

export function DropdownDescription({
    className,
    ...props
}: { className?: string } & Omit<Headless.DescriptionProps, 'as' | 'className'>) {
    return (
        <Headless.Description
            data-slot="description"
            {...props}
            className={clsx(
                className,
                'col-span-2 col-start-2 row-start-2 text-sm/5 text-zinc-500 group-data-focus:text-zinc-600 sm:text-xs/5 dark:text-zinc-400 dark:group-data-focus:text-zinc-300 forced-colors:group-data-focus:text-[HighlightText]'
            )}
        />
    );
}

export function DropdownShortcut({
    keys,
    className,
    ...props
}: { keys: string | string[]; className?: string } & Omit<Headless.DescriptionProps<'kbd'>, 'as' | 'className'>) {
    return (
        <Headless.Description
            as="kbd"
            {...props}
            className={clsx(className, 'col-start-5 row-start-1 flex justify-self-end')}
        >
            {(Array.isArray(keys) ? keys : keys.split('')).map((char, index) => (
                <kbd
                    key={index}
                    className={clsx([
                        'min-w-[2ch] text-center font-sans text-zinc-400 capitalize group-data-focus:text-zinc-600 dark:group-data-focus:text-zinc-300 forced-colors:group-data-focus:text-[HighlightText]',
                        // Make sure key names that are longer than one character (like "Tab") have extra space
                        index > 0 && char.length > 1 && 'pl-1',
                    ])}
                >
                    {char}
                </kbd>
            ))}
        </Headless.Description>
    );
}
