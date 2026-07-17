import { XMarkIcon } from '@heroicons/react/20/solid';
import * as Headless from '@headlessui/react';
import type { ReactNode } from 'react';

import { Button } from '@/components/button';
import { cn } from '@/lib/utils';

type SideDrawerProps = {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    closeLabel?: string;
    titleClassName?: string;
};

export function SideDrawer({
    open,
    onClose,
    title,
    children,
    footer,
    closeLabel = 'Close',
    titleClassName,
}: SideDrawerProps) {
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
                                    <XMarkIcon data-slot="icon" />
                                </Headless.CloseButton>
                            </div>

                            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain">
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
