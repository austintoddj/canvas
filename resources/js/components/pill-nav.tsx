'use client';

import clsx from 'clsx';
import { LayoutGroup, motion } from 'motion/react';
import React, { createContext, useContext, useId } from 'react';

type PillNavContextValue = {
    value: string;
    onChange: (value: string) => void;
    layoutId: string;
};

const PillNavContext = createContext<PillNavContextValue | null>(null);

function usePillNav(component: string): PillNavContextValue {
    const context = useContext(PillNavContext);

    if (context === null) {
        throw new Error(`${component} must be used within a PillNav`);
    }

    return context;
}

/**
 * Animated segmented control with a sliding “floating pill” indicator.
 * Uses Motion (formerly Framer Motion) shared layout animations.
 */
export function PillNav<T extends string>({
    value,
    onChange,
    className,
    children,
    'aria-label': ariaLabel,
}: {
    value: T;
    onChange: (value: T) => void;
    className?: string;
    children: React.ReactNode;
    'aria-label'?: string;
}) {
    const id = useId();
    const groupId = `pill-nav-${id}`;
    const layoutId = `${groupId}-active`;

    return (
        <LayoutGroup id={groupId}>
            <div
                role="radiogroup"
                aria-label={ariaLabel}
                className={clsx(
                    className,
                    'inline-flex items-center gap-0.5 rounded-full bg-zinc-950/5 p-1 dark:bg-white/[0.06] dark:ring-1 dark:ring-white/5'
                )}
            >
                <PillNavContext.Provider
                    value={{
                        value,
                        onChange: (next) => onChange(next as T),
                        layoutId,
                    }}
                >
                    {children}
                </PillNavContext.Provider>
            </div>
        </LayoutGroup>
    );
}

export function PillNavItem({
    value,
    children,
    className,
    disabled = false,
}: {
    value: string;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}) {
    const { value: selected, onChange, layoutId } = usePillNav('PillNavItem');
    const current = selected === value;

    return (
        <button
            type="button"
            role="radio"
            aria-checked={current}
            disabled={disabled}
            onClick={() => onChange(value)}
            className={clsx(
                className,
                // Base
                'relative isolate inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm/5 font-medium',
                // Focus
                'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                // Disabled
                'disabled:cursor-not-allowed disabled:opacity-50',
                // Colors
                current
                    ? 'text-zinc-950 dark:text-white'
                    : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
            )}
        >
            {current ? (
                <motion.span
                    layoutId={layoutId}
                    className="absolute inset-0 -z-10 rounded-full bg-white shadow-sm dark:bg-zinc-700 dark:shadow-none dark:ring-1 dark:ring-white/10"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                />
            ) : null}
            {children}
        </button>
    );
}
