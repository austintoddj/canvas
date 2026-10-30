import clsx from 'clsx';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import React, {
    Children,
    createContext,
    isValidElement,
    useCallback,
    useContext,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

type PillNavIndicator = 'layout' | 'slide';

/** `spring` keeps its name for callers. It is a 200ms ease with no bounce. `ease` stays locked to a sibling panel expand. */
type PillNavSlideMotion = 'spring' | 'ease';

type PillNavContextValue = {
    value: string;
    onChange: (value: string) => void;
    layoutId: string;
    reducedMotion: boolean;
    indicator: PillNavIndicator;
};

type SlideMetrics = {
    x: number;
    y: number;
    width: number;
    height: number;
};

const PillNavContext = createContext<PillNavContextValue | null>(null);

function usePillNav(component: string): PillNavContextValue {
    const context = useContext(PillNavContext);

    if (context === null) {
        throw new Error(`${component} must be used within a PillNav`);
    }

    return context;
}

/** Duration (seconds) for `slideMotion="ease"` — keep sibling panel expands in sync. */
export const PILL_SLIDE_DURATION_S = 0.28;

/** Default indicator. No bounce, at every width. */
const PILL_INDICATOR_MS = 200;
const PILL_INDICATOR_EASE = [0.22, 1, 0.36, 1] as const;
const PILL_INDICATOR_TRANSITION = { duration: PILL_INDICATOR_MS / 1000, ease: PILL_INDICATOR_EASE } as const;

/** CSS twin of the layout indicator so `slide` mode stays Safari-stable under re-renders. */
const SLIDE_DEFAULT_CSS = `transform ${PILL_INDICATOR_MS}ms cubic-bezier(${PILL_INDICATOR_EASE.join(', ')})`;

const SLIDE_EASE_CSS = `transform ${PILL_SLIDE_DURATION_S * 1000}ms cubic-bezier(0.2, 0, 0, 1)`;

/**
 * Ignore sub-pixel churn from Safari layout / scrollbar width. Transforms keep
 * full precision; we only skip no-op state writes.
 */
function slideMetricsClose(a: SlideMetrics, b: SlideMetrics): boolean {
    return (
        Math.abs(a.x - b.x) < 0.5 &&
        Math.abs(a.y - b.y) < 0.5 &&
        Math.abs(a.width - b.width) < 0.5 &&
        Math.abs(a.height - b.height) < 0.5
    );
}

/**
 * Animated segmented control with a sliding “floating pill” indicator.
 *
 * - `layout` (default): shared layoutId ease — great for mixed-width items.
 * - `slide`: transform-only indicator for equal-width items; immune to parent
 *   reflow. Uses CSS `transform` transitions (not Motion) so concurrent React
 *   updates (e.g. media grid refetch) do not interrupt the slide on Safari.
 */
export function PillNav<T extends string>({
    value,
    onChange,
    className,
    children,
    indicator = 'layout',
    slideMotion = 'spring',
    stackBelowSm = false,
    'aria-label': ariaLabel,
}: {
    value: T;
    onChange: (value: T) => void;
    className?: string;
    children: React.ReactNode;
    indicator?: PillNavIndicator;
    slideMotion?: PillNavSlideMotion;
    /** One full-width option per row below `sm`. From `sm`, equal columns. */
    stackBelowSm?: boolean;
    'aria-label'?: string;
}) {
    const id = useId();
    const groupId = `pill-nav-${id}`;
    const layoutId = `${groupId}-active`;
    const reducedMotion = useReducedMotion() === true;
    const trackRef = useRef<HTMLDivElement>(null);
    const [slide, setSlide] = useState<SlideMetrics | null>(null);
    /** Only selection changes animate; resize corrections snap (avoids Safari end-jerk). */
    const [animateSlide, setAnimateSlide] = useState(false);
    const freezeResizeUntilRef = useRef(0);
    const selectedIndexRef = useRef(0);
    const placedRef = useRef(false);

    const values = Children.toArray(children).flatMap((child) => {
        if (!isValidElement<{ value?: string }>(child) || typeof child.props.value !== 'string') {
            return [];
        }

        return [child.props.value];
    });
    const count = Math.max(values.length, 1);
    const selectedIndex = Math.max(0, values.indexOf(value));
    selectedIndexRef.current = selectedIndex;

    const readActiveMetrics = useCallback((): SlideMetrics | null => {
        const track = trackRef.current;

        if (track === null) {
            return null;
        }

        const items = track.querySelectorAll<HTMLElement>(':scope > [role="radio"]');
        const active = items.item(selectedIndexRef.current);

        if (active === null) {
            return null;
        }

        // getBoundingClientRect keeps subpixels; offset* can 1px-jump on Retina Safari.
        const trackRect = track.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();

        return {
            x: activeRect.left - trackRect.left,
            y: activeRect.top - trackRect.top,
            width: activeRect.width,
            height: activeRect.height,
        };
    }, []);

    const slideRef = useRef<SlideMetrics | null>(null);

    const measureSlide = useCallback(
        (options?: { force?: boolean; animate?: boolean }) => {
            if (indicator !== 'slide') {
                return;
            }

            if (!options?.force && performance.now() < freezeResizeUntilRef.current) {
                return;
            }

            const next = readActiveMetrics();

            if (next === null) {
                return;
            }

            const current = slideRef.current;

            if (current !== null && slideMetricsClose(current, next)) {
                placedRef.current = true;

                return;
            }

            const shouldAnimate = Boolean(options?.animate && placedRef.current && !reducedMotion);

            setAnimateSlide(shouldAnimate);
            slideRef.current = next;
            setSlide(next);
            placedRef.current = true;
        },
        [indicator, readActiveMetrics, reducedMotion]
    );

    useLayoutEffect(() => {
        if (indicator !== 'slide') {
            return;
        }

        const durationMs = slideMotion === 'spring' ? PILL_INDICATOR_MS : PILL_SLIDE_DURATION_S * 1000;
        freezeResizeUntilRef.current = performance.now() + durationMs + 50;

        measureSlide({ force: true, animate: true });

        const track = trackRef.current;

        if (track === null || typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver(() => {
            measureSlide({ animate: false });
        });

        observer.observe(track);

        for (const item of track.querySelectorAll(':scope > [role="radio"]')) {
            observer.observe(item);
        }

        return () => {
            observer.disconnect();
        };
    }, [indicator, measureSlide, count, value, slideMotion]);

    const slideTransitionCss =
        !reducedMotion && animateSlide ? (slideMotion === 'ease' ? SLIDE_EASE_CSS : SLIDE_DEFAULT_CSS) : undefined;

    const track = (
        <div
            ref={trackRef}
            role="radiogroup"
            aria-label={ariaLabel}
            className={clsx(
                className,
                'relative items-center gap-0.5 rounded-full bg-zinc-950/5 p-1 dark:bg-white/[0.06] dark:ring-1 dark:ring-white/5',
                // Equal columns so the measured indicator stays aligned under reflow
                // (e.g. media grid refetch under Mine / All authors).
                // `stackBelowSm` is one column on a phone so long labels do not share a row.
                indicator === 'slide'
                    ? stackBelowSm
                        ? 'grid w-full grid-cols-1 sm:grid-cols-none sm:grid-flow-col sm:auto-cols-fr'
                        : 'inline-grid grid-flow-col auto-cols-fr'
                    : 'inline-flex'
            )}
        >
            {indicator === 'slide' && slide !== null ? (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 left-0 rounded-full bg-white shadow-sm will-change-transform dark:bg-zinc-700 dark:shadow-none dark:ring-1 dark:ring-white/10"
                    style={{
                        width: slide.width,
                        height: slide.height,
                        transform: `translate3d(${slide.x}px, ${slide.y}px, 0)`,
                        transition: slideTransitionCss,
                    }}
                />
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
                indicator === 'slide' && 'w-full justify-center',
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
                        transition={PILL_INDICATOR_TRANSITION}
                    />
                )
            ) : null}
            <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
        </button>
    );
}
