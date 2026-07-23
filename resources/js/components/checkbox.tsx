import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import type React from 'react';

export function CheckboxGroup({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            data-slot="control"
            {...props}
            className={clsx(
                className,
                'space-y-3',
                'has-data-[slot=description]:space-y-6 has-data-[slot=description]:**:data-[slot=label]:font-medium'
            )}
        />
    );
}

export function CheckboxField({
    className,
    ...props
}: { className?: string } & Omit<Headless.FieldProps, 'as' | 'className'>) {
    return (
        <Headless.Field
            data-slot="field"
            {...props}
            className={clsx(
                className,
                'grid grid-cols-[1.125rem_1fr] gap-x-4 gap-y-1 sm:grid-cols-[1rem_1fr]',
                '*:data-[slot=control]:col-start-1 *:data-[slot=control]:row-start-1 *:data-[slot=control]:mt-0.75 sm:*:data-[slot=control]:mt-1',
                '*:data-[slot=label]:col-start-2 *:data-[slot=label]:row-start-1',
                '*:data-[slot=description]:col-start-2 *:data-[slot=description]:row-start-2',
                'has-data-[slot=description]:**:data-[slot=label]:font-medium'
            )}
        />
    );
}

const base = [
    'relative isolate flex size-4.5 items-center justify-center rounded-[0.3125rem] sm:size-4',
    'before:absolute before:inset-0 before:-z-10 before:rounded-[calc(0.3125rem-1px)] before:bg-white before:shadow-sm',
    'group-data-checked:before:hidden',
    'dark:before:hidden',
    'dark:bg-white/5 dark:group-data-checked:bg-current',
    'border border-zinc-950/15 group-data-checked:border-transparent group-data-hover:group-data-checked:border-transparent group-data-hover:border-zinc-950/30 group-data-checked:bg-current',
    'dark:border-white/15 dark:group-data-checked:border-white/5 dark:group-data-hover:group-data-checked:border-white/5 dark:group-data-hover:border-white/30',
    'after:pointer-events-none after:absolute after:inset-0 after:rounded-[calc(0.3125rem-1px)] after:ring-transparent after:ring-inset group-data-focus:after:ring-2 group-data-focus:after:ring-blue-500',
    'group-data-disabled:opacity-50',
    'group-data-disabled:border-zinc-950/25 group-data-disabled:bg-zinc-950/5 group-data-disabled:[--checkbox-check:var(--color-zinc-950)]/50 group-data-disabled:before:bg-transparent',
    'dark:group-data-disabled:border-white/20 dark:group-data-disabled:bg-white/2.5 dark:group-data-disabled:[--checkbox-check:var(--color-white)]/50 dark:group-data-checked:group-data-disabled:after:hidden',
    'forced-colors:[--checkbox-check:HighlightText] forced-colors:group-data-disabled:[--checkbox-check:Highlight]',
    'dark:group-data-disabled:group-data-checked:border-white/15',
];

const colors = {
    'dark/zinc': [
        '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-zinc-900)] [--checkbox-checked-border:var(--color-zinc-950)]/90',
        'dark:[--checkbox-check:var(--color-white)] dark:[--checkbox-checked-bg:var(--color-zinc-600)]',
    ],
    'dark/white': [
        '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-zinc-900)] [--checkbox-checked-border:var(--color-zinc-950)]/90',
        'dark:[--checkbox-check:var(--color-zinc-900)] dark:[--checkbox-checked-bg:var(--color-white)] dark:[--checkbox-checked-border:var(--color-zinc-950)]/15',
    ],
    white: [
        '[--checkbox-check:var(--color-zinc-900)] [--checkbox-checked-bg:var(--color-white)] [--checkbox-checked-border:var(--color-zinc-950)]/15',
    ],
    dark: [
        '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-zinc-900)] [--checkbox-checked-border:var(--color-zinc-950)]/90',
    ],
    zinc: [
        '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-zinc-600)] [--checkbox-checked-border:var(--color-zinc-700)]/90',
    ],
    blue: [
        '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-blue-600)] [--checkbox-checked-border:var(--color-blue-700)]/90',
    ],
};

type Color = keyof typeof colors;

export function Checkbox({
    color = 'dark/zinc',
    className,
    ...props
}: {
    color?: Color;
    className?: string;
} & Omit<Headless.CheckboxProps, 'as' | 'className'>) {
    return (
        <Headless.Checkbox
            data-slot="control"
            {...props}
            className={clsx(className, 'group inline-flex focus:outline-hidden')}
        >
            <span className={clsx([base, colors[color]])}>
                <svg
                    className="size-4 stroke-(--checkbox-check) opacity-0 group-data-checked:opacity-100 sm:h-3.5 sm:w-3.5"
                    viewBox="0 0 14 14"
                    fill="none"
                >
                    <path
                        className="opacity-100 group-data-indeterminate:opacity-0"
                        d="M3 8L6 11L11 3.5"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        className="opacity-0 group-data-indeterminate:opacity-100"
                        d="M3 7H11"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>
        </Headless.Checkbox>
    );
}
