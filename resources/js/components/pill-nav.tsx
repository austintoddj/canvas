import clsx from 'clsx';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import React, { Children, createContext, isValidElement, useContext, useId } from 'react';

type PillNavIndicator = 'layout' | 'slide';

type PillNavContextValue = {
    value: string;
    onChange: (value: string) => void;
    layoutId: string;
    reducedMotion: boolean;
    indicator: PillNavIndicator;
};

const PillNavContext = createContext<PillNavContextValue | null>(null);

function usePillNav(component: string): PillNavContextValue {
    const context = useContext(PillNavContext);

    if (context === null) {
        throw new Error(`${component} must be used within a PillNav`);
    }

    return context;
}

/** Duration (seconds) for `indicator="slide"` — keep sibling panel expands in sync. */
export const PILL_SLIDE_DURATION_S = 0.28;

/**
 * Animated segmented control with a sliding “floating pill” indicator.
 *
 * - `layout` (default): shared layoutId spring — great for mixed-width items.
 * - `slide`: transform-only indicator for equal-width items; immune to parent
 *   reflow (e.g. a dialog growing when schedule UI mounts).
 */
export function PillNav<T extends string>({
    value,
    onChange,
    className,
    children,
    indicator = 'layout',
    'aria-label': ariaLabel,
}: {
    value: T;
    onChange: (value: T) => void;
    className?: string;
    children: React.ReactNode;
    indicator?: PillNavIndicator;
    'aria-label'?: string;
}) {
    const id = useId();
    const groupId = `pill-nav-${id}`;
    const layoutId = `${groupId}-active`;
    const reducedMotion = useReducedMotion() === true;

    const values = Children.toArray(children).flatMap((child) => {
        if (!isValidElement<{ value?: string }>(child) || typeof child.props.value !== 'string') {
            return [];
        }

        return [child.props.value];
    });
    const count = Math.max(values.length, 1);
    const selectedIndex = Math.max(0, values.indexOf(value));
    // p-1 (0.25rem × 2) + gap-0.5 between items (0.125rem × (n − 1))
    const trackInsetRem = 0.5 + Math.max(0, count - 1) * 0.125;
    const slideWidth = `calc((100% - ${trackInsetRem}rem) / ${count})`;
    const slideX = selectedIndex === 0 ? 0 : `calc(${selectedIndex} * (100% + 0.125rem))`;

    const track = (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className={clsx(
                className,
                'relative inline-flex items-center gap-0.5 rounded-full bg-zinc-950/5 p-1 dark:bg-white/[0.06] dark:ring-1 dark:ring-white/5'
            )}
        >
            {indicator === 'slide' ? (
                reducedMotion ? (
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-full bg-white shadow-sm dark:bg-zinc-700 dark:shadow-none dark:ring-1 dark:ring-white/10"
                        style={{
                            width: slideWidth,
                            transform: `translateX(${typeof slideX === 'number' ? '0px' : slideX})`,
                        }}
                    />
                ) : (
                    <motion.span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-full bg-white shadow-sm dark:bg-zinc-700 dark:shadow-none dark:ring-1 dark:ring-white/10"
                        style={{ width: slideWidth }}
                        initial={false}
                        animate={{ x: slideX }}
                        transition={{ duration: PILL_SLIDE_DURATION_S, ease: [0.2, 0, 0, 1] }}
                    />
                )
            ) : null}

            <PillNavContext.Provider
                value={{
                    value,
                    onChange: (next) => onChange(next as T),
                    layoutId,
                    reducedMotion,
                    indicator,
                }}
            >
                {children}
            </PillNavContext.Provider>
        </div>
    );

    if (indicator === 'layout') {
        return <LayoutGroup id={groupId}>{track}</LayoutGroup>;
    }

    return track;
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
    const { value: selected, onChange, layoutId, reducedMotion, indicator } = usePillNav('PillNavItem');
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
                'relative isolate inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm/5 font-medium',
                'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                'disabled:cursor-not-allowed disabled:opacity-50',
                current
                    ? 'text-zinc-950 dark:text-white'
                    : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
            )}
        >
            {indicator === 'layout' && current ? (
                reducedMotion ? (
                    <span
                        className="absolute inset-0 -z-10 rounded-full bg-white shadow-sm dark:bg-zinc-700 dark:shadow-none dark:ring-1 dark:ring-white/10"
                        aria-hidden="true"
                    />
                ) : (
                    <motion.span
                        layoutId={layoutId}
                        className="absolute inset-0 -z-10 rounded-full bg-white shadow-sm dark:bg-zinc-700 dark:shadow-none dark:ring-1 dark:ring-white/10"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                    />
                )
            ) : null}
            <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
        </button>
    );
}
