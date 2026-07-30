import { createPortal } from 'react-dom';
import clsx from 'clsx';
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type FocusEvent,
    type ReactNode,
} from 'react';

import { useFinePointerHover } from '@/hooks/useFinePointerHover';

type Placement = 'right' | 'left' | 'top' | 'bottom';

type TooltipProps = {
    content: ReactNode;
    children: ReactNode;
    placement?: Placement;
    /** When true, never show the tip (expanded sidebar, etc.). */
    disabled?: boolean;
    delayMs?: number;
    /** Classes for the floating tip surface. */
    className?: string;
    /** Classes for the hover/focus trigger wrapper. */
    triggerClassName?: string;
};

type Coords = { top: number; left: number };

function positionFor(trigger: DOMRect, tip: DOMRect, placement: Placement): Coords {
    const gap = 10;

    switch (placement) {
        case 'left':
            return {
                top: trigger.top + trigger.height / 2 - tip.height / 2,
                left: trigger.left - tip.width - gap,
            };
        case 'top':
            return {
                top: trigger.top - tip.height - gap,
                left: trigger.left + trigger.width / 2 - tip.width / 2,
            };
        case 'bottom':
            return {
                top: trigger.bottom + gap,
                left: trigger.left + trigger.width / 2 - tip.width / 2,
            };
        case 'right':
        default:
            return {
                top: trigger.top + trigger.height / 2 - tip.height / 2,
                left: trigger.right + gap,
            };
    }
}

/**
 * Fine-pointer only; no tip when `disabled`.
 */
export function Tooltip({
    content,
    children,
    placement = 'right',
    disabled = false,
    delayMs = 160,
    className,
    triggerClassName,
}: TooltipProps) {
    const fineHover = useFinePointerHover();
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<Coords | null>(null);
    const tooltipId = useId();
    const triggerRef = useRef<HTMLSpanElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const active = !disabled && fineHover;
    const visible = active && open;

    const clearOpenTimer = useCallback(() => {
        if (openTimer.current != null) {
            clearTimeout(openTimer.current);
            openTimer.current = null;
        }
    }, []);

    useEffect(() => () => clearOpenTimer(), [clearOpenTimer]);

    useLayoutEffect(() => {
        if (!visible) {
            return;
        }

        const trigger = triggerRef.current;
        const tip = tipRef.current;
        if (!trigger || !tip) {
            return;
        }

        const update = () => {
            const next = positionFor(trigger.getBoundingClientRect(), tip.getBoundingClientRect(), placement);
            setCoords(next);
        };

        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);

        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [visible, placement, content]);

    const show = useCallback(() => {
        if (!active) {
            return;
        }

        clearOpenTimer();
        if (delayMs <= 0) {
            setOpen(true);
            return;
        }

        openTimer.current = setTimeout(() => setOpen(true), delayMs);
    }, [active, clearOpenTimer, delayMs]);

    const hide = useCallback(() => {
        clearOpenTimer();
        setOpen(false);
        setCoords(null);
    }, [clearOpenTimer]);

    /**
     * Keyboard focus only. Programmatic restore (dialog/drawer close) is not
     * :focus-visible and must not re-open the tip while the pointer still sits
     * on the trigger.
     */
    const showFromFocus = useCallback(
        (event: FocusEvent<HTMLSpanElement>) => {
            const target = event.target;
            if (!(target instanceof Element) || !target.matches(':focus-visible')) {
                return;
            }

            show();
        },
        [show]
    );

    return (
        <>
            <span
                ref={triggerRef}
                className={clsx('min-w-0', triggerClassName ?? 'inline-flex')}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={showFromFocus}
                onBlur={hide}
                onPointerDown={hide}
                aria-describedby={visible ? tooltipId : undefined}
            >
                {children}
            </span>
            {visible && typeof document !== 'undefined'
                ? createPortal(
                      <div
                          ref={tipRef}
                          id={tooltipId}
                          role="tooltip"
                          style={{
                              position: 'fixed',
                              top: coords?.top ?? -9999,
                              left: coords?.left ?? -9999,
                              opacity: coords ? 1 : 0,
                          }}
                          className={clsx(
                              'pointer-events-none z-50 max-w-xs rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white shadow-lg',
                              'ring-1 ring-white/10 transition-opacity duration-100 dark:bg-zinc-800 dark:ring-white/15',
                              className
                          )}
                      >
                          {content}
                      </div>,
                      document.body
                  )
                : null}
        </>
    );
}

/** Label + optional keyboard shortcut chips for collapsed-rail tips. */
export function TooltipShortcut({ label, keys }: { label: ReactNode; keys?: ReactNode }) {
    return (
        <span className="inline-flex items-center gap-2">
            <span>{label}</span>
            {keys ? <span className="inline-flex items-center gap-0.5 opacity-80">{keys}</span> : null}
        </span>
    );
}
