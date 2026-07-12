import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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
            return 'text-canvas-muted dark:text-canvas-muted-dark';
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
    const reducedMotion = useReducedMotion();

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
            layout={!reducedMotion}
            role={item.tone === 'error' ? 'alert' : 'status'}
            aria-live={item.tone === 'error' ? 'assertive' : 'polite'}
            data-toast
            data-toast-tone={item.tone}
            initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 36, mass: 0.7 }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-zinc-950/10 bg-white px-3.5 py-3 text-sm shadow-lg shadow-zinc-950/10 ring-1 ring-zinc-950/5 dark:border-white/10 dark:bg-zinc-800 dark:shadow-2xl dark:shadow-black/50 dark:ring-white/10"
        >
            <ToastToneIcon tone={item.tone} />
            <p className="min-w-0 flex-1 text-[13px]/leading-5 text-zinc-950 dark:text-zinc-100">{item.message}</p>
            <button
                type="button"
                className="shrink-0 rounded-md p-0.5 text-zinc-400 transition hover:bg-zinc-950/5 hover:text-zinc-700 focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-white/10 dark:hover:text-zinc-200"
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
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-end gap-2 p-4 sm:inset-x-auto sm:right-0 sm:bottom-0 sm:max-w-md sm:p-6"
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
