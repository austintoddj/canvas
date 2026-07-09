import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useSyncExternalStore } from 'react';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon,
} from '@heroicons/react/20/solid';
import clsx from 'clsx';

import { dismissToast, getToasts, subscribeToasts, type ToastItem, type ToastTone } from '@/lib/toast';

function toneClasses(tone: ToastTone): string {
    switch (tone) {
        case 'success':
            return 'text-emerald-600 dark:text-emerald-400';
        case 'error':
            return 'text-red-600 dark:text-red-400';
        case 'warning':
            return 'text-amber-600 dark:text-amber-400';
        default:
            return 'text-zinc-500 dark:text-zinc-400';
    }
}

function ToastToneIcon({ tone, className }: { tone: ToastTone; className?: string }) {
    const iconClass = clsx('mt-0.5 size-5 shrink-0', toneClasses(tone), className);

    switch (tone) {
        case 'success':
            return <CheckCircleIcon className={iconClass} aria-hidden="true" />;
        case 'error':
            return <ExclamationCircleIcon className={iconClass} aria-hidden="true" />;
        case 'warning':
            return <ExclamationTriangleIcon className={iconClass} aria-hidden="true" />;
        default:
            return <InformationCircleIcon className={iconClass} aria-hidden="true" />;
    }
}

function ToastCard({ item }: { item: ToastItem }) {
    useEffect(() => {
        if (item.duration <= 0) {
            return;
        }

        const timer = window.setTimeout(() => {
            dismissToast(item.id);
        }, item.duration);

        return () => {
            window.clearTimeout(timer);
        };
    }, [item.id, item.duration]);

    return (
        <motion.div
            layout
            role={item.tone === 'error' ? 'alert' : 'status'}
            aria-live={item.tone === 'error' ? 'assertive' : 'polite'}
            data-toast
            data-toast-tone={item.tone}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 36, mass: 0.7 }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-zinc-950/10 bg-white px-3.5 py-3 text-sm shadow-lg shadow-zinc-950/10 ring-1 ring-zinc-950/5 dark:border-white/10 dark:bg-zinc-900 dark:shadow-black/40 dark:ring-white/10"
        >
            <ToastToneIcon tone={item.tone} />
            <p className="min-w-0 flex-1 text-[13px]/leading-5 text-zinc-950 dark:text-zinc-100">{item.message}</p>
            <button
                type="button"
                className="shrink-0 rounded-md p-0.5 text-zinc-400 transition hover:bg-zinc-950/5 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 dark:hover:bg-white/10 dark:hover:text-zinc-200 dark:focus-visible:ring-white/25"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(item.id)}
            >
                <XMarkIcon className="size-4" aria-hidden="true" />
            </button>
        </motion.div>
    );
}

export function Toaster() {
    const items = useSyncExternalStore(subscribeToasts, getToasts, getToasts);

    return (
        <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-end gap-2 p-4 sm:inset-x-auto sm:right-0 sm:bottom-0 sm:max-w-md sm:p-6"
            data-toaster
            aria-label="Notifications"
        >
            <AnimatePresence initial={false} mode="popLayout">
                {items.map((item) => (
                    <ToastCard key={item.id} item={item} />
                ))}
            </AnimatePresence>
        </div>
    );
}
