import { XMarkIcon } from '@heroicons/react/20/solid';
import * as Headless from '@headlessui/react';
import type { ReactNode } from 'react';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { cn } from '@/lib/utils';

type SideDrawerProps = {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    closeLabel?: string;
    titleClassName?: string;
};

export function SideDrawer({
    open,
    onClose,
    title,
    description,
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

            <div className="fixed inset-0 flex justify-end overflow-hidden p-2">
                <Headless.DialogPanel
                    transition
                    className="flex h-full w-full max-w-md transition duration-300 ease-in-out data-closed:translate-x-full sm:max-w-lg"
                >
                    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-canvas-panel shadow-xs ring-1 ring-zinc-950/5 dark:bg-canvas-panel-dark dark:shadow-2xl dark:shadow-black/40 dark:ring-white/10">
                        <div className="flex items-start justify-between gap-3 border-b border-canvas-border px-5 py-4 dark:border-canvas-border-dark">
                            <div className="min-w-0">
                                <Headless.DialogTitle
                                    className={cn(
                                        'text-base/6 font-semibold text-canvas-fg dark:text-canvas-fg-dark',
                                        titleClassName
                                    )}
                                >
                                    {title}
                                </Headless.DialogTitle>
                                {description ? <Text className="mt-0.5 text-sm">{description}</Text> : null}
                            </div>
                            <Headless.CloseButton as={Button} plain aria-label={closeLabel} className="shrink-0">
                                <XMarkIcon data-slot="icon" />
                            </Headless.CloseButton>
                        </div>

                        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
                            {children}
                        </div>

                        {footer ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-canvas-border px-5 py-4 dark:border-canvas-border-dark">
                                {footer}
                            </div>
                        ) : null}
                    </div>
                </Headless.DialogPanel>
            </div>
        </Headless.Dialog>
    );
}
