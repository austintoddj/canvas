import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useSyncExternalStore } from 'react';
import clsx from 'clsx';

import { TouchTarget } from '@/components/button';
import { t } from '@/lib/i18n';
import { dismissToast, getToasts, subscribeToasts, type ToastItem, type ToastTone } from '@/lib/toast';
import { IconAlertTriangle, IconCircleCheck, IconExclamationCircle, IconInfoCircle, IconX } from '@tabler/icons-react';

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
            return <IconCircleCheck className={iconClass} aria-hidden="true" />;
        case 'error':
            return <IconExclamationCircle className={iconClass} aria-hidden="true" />;
        case 'warning':
            return <IconAlertTriangle className={iconClass} aria-hidden="true" />;
        default:
            return <IconInfoCircle className={iconClass} aria-hidden="true" />;
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
            role={item.tone === 'error' ? 'alert' : 'status'}
            aria-live={item.tone === 'error' ? 'assertive' : 'polite'}
            data-toast
            data-toast-tone={item.tone}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
            className="pointer-events-auto flex w-full items-start gap-3 rounded-xl bg-white px-3.5 py-3 text-sm shadow-lg ring-1 ring-zinc-950/10 sm:max-w-sm dark:bg-zinc-800 dark:ring-white/10"
        >
            <ToastToneIcon tone={item.tone} />
            <p className="min-w-0 flex-1 text-[13px]/leading-5 text-zinc-950 dark:text-zinc-100">{item.message}</p>
            <button
                type="button"
                className="relative shrink-0 rounded-md p-0.5 text-zinc-400 transition hover:bg-zinc-950/5 hover:text-zinc-700 focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                aria-label={t('common.dismiss_notification')}
                onClick={() => dismissToast(item.id)}
            >
                <TouchTarget>
                    <IconX className="size-4" aria-hidden="true" />
                </TouchTarget>
            </button>
        </motion.div>
    );
}

export function Toaster() {
    const items = useSyncExternalStore(subscribeToasts, getToasts, getToasts);

    return (
        <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-0 sm:max-w-md sm:items-end sm:p-6 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            data-toaster
            aria-label={t('common.notifications')}
        >
            <AnimatePresence initial={false} mode="popLayout">
                {items.map((item) => (
                    <ToastCard key={item.id} item={item} />
                ))}
            </AnimatePresence>
        </div>
    );
}
