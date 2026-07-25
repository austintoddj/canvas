import * as Headless from '@headlessui/react';
import { useLayoutEffect, useRef, type ReactNode, type UIEvent } from 'react';

import { Button } from '@/components/button';
import { cn } from '@/lib/utils';
import { IconX } from '@tabler/icons-react';

type SideDrawerProps = {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    closeLabel?: string;
    titleClassName?: string;
};

/**
 * Apply a remembered scroll offset without writing the clamped value back to memory.
 * Temporary content shrinks (remounts / loading flashes) must not erase the user's place.
 */
function applyScrollTop(el: HTMLElement, top: number): void {
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    const next = Math.min(Math.max(0, top), max);

    if (el.scrollTop !== next) {
        el.scrollTop = next;
    }
}

export function SideDrawer({
    open,
    onClose,
    title,
    children,
    footer,
    closeLabel = 'Close',
    titleClassName,
}: SideDrawerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollTopRef = useRef(0);
    const wasOpenRef = useRef(false);
    /** Ignore browser scroll events fired while we re-apply a remembered position. */
    const restoringRef = useRef(false);

    useLayoutEffect(() => {
        const el = scrollRef.current;
        const justOpened = open && !wasOpenRef.current;
        wasOpenRef.current = open;

        if (!open) {
            scrollTopRef.current = 0;
            restoringRef.current = false;

            if (el) {
                el.scrollTop = 0;
            }

            return;
        }

        if (justOpened) {
            scrollTopRef.current = 0;
            if (el) {
                el.scrollTop = 0;
            }
            return;
        }

        if (!el) {
            return;
        }

        restoringRef.current = true;
        applyScrollTop(el, scrollTopRef.current);

        // Focus traps / layout clamps often adjust scroll after this layout pass.
        const frame = requestAnimationFrame(() => {
            if (scrollRef.current) {
                applyScrollTop(scrollRef.current, scrollTopRef.current);
            }

            restoringRef.current = false;
        });

        return () => {
            cancelAnimationFrame(frame);
            restoringRef.current = false;
        };
    });

    function handleScroll(event: UIEvent<HTMLDivElement>) {
        if (restoringRef.current || !open) {
            return;
        }

        scrollTopRef.current = event.currentTarget.scrollTop;
    }

    return (
        <Headless.Dialog open={open} onClose={onClose} className="relative z-50" data-side-drawer="true">
            <Headless.DialogBackdrop
                transition
                className="fixed inset-0 bg-zinc-950/25 transition duration-300 ease-out data-closed:opacity-0 dark:bg-zinc-950/50"
            />

            <div className="fixed inset-0 overflow-hidden p-2">
                <div className="flex h-full justify-end">
                    <Headless.DialogPanel
                        transition
                        className="flex h-full w-full max-w-md min-h-0 transition duration-300 ease-in-out data-closed:translate-x-full sm:max-w-lg"
                    >
                        <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg bg-canvas-panel shadow-xs ring-1 ring-zinc-950/5 dark:bg-canvas-panel-dark dark:shadow-2xl dark:shadow-black/40 dark:ring-white/10">
                            <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3.5">
                                <div className="min-w-0">
                                    <Headless.DialogTitle
                                        className={cn(
                                            'text-lg/7 font-semibold text-canvas-fg dark:text-canvas-fg-dark',
                                            titleClassName
                                        )}
                                    >
                                        {title}
                                    </Headless.DialogTitle>
                                </div>
                                <Headless.CloseButton as={Button} plain aria-label={closeLabel} className="shrink-0">
                                    <IconX data-slot="icon" />
                                </Headless.CloseButton>
                            </div>

                            <div
                                ref={scrollRef}
                                onScroll={handleScroll}
                                data-side-drawer-scroll="true"
                                className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain"
                            >
                                {children}
                            </div>

                            {footer ? (
                                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-canvas-border px-5 py-4 dark:border-canvas-border-dark">
                                    {footer}
                                </div>
                            ) : null}
                        </div>
                    </Headless.DialogPanel>
                </div>
            </div>
        </Headless.Dialog>
    );
}
