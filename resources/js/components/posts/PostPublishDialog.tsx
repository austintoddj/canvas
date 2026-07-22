import { useState } from 'react';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';

import { Button } from '@/components/button';
import DateTimePicker from '@/components/DateTimePicker';
import { Dialog, DialogActions, DialogBody, DialogCloseButton, DialogTitle } from '@/components/dialog';
import { PillNav, PillNavItem, PILL_SLIDE_DURATION_S } from '@/components/pill-nav';
import { useCanvas } from '@/hooks/useCanvas';
import { shouldAnimateReveal } from '@/lib/async-ui';
import { defaultScheduleDate, isScheduleInFuture, toPickerValue } from '@/lib/datetime-picker';
import { canPublishForm, isScheduled, toDatetimeLocalValue, type PostFormState } from '@/lib/posts/form';
import type { PublishTimingMode } from '@/lib/posts/publish-dialog';

type PostPublishDialogProps = {
    open: boolean;
    form: PostFormState;
    busy?: boolean;
    disabled?: boolean;
    onClose: () => void;
    onPublishNow: () => void | Promise<void>;
    onSchedule: (datetimeLocal: string) => void | Promise<void>;
};

function seedScheduleValue(existing: string): string {
    if (existing.trim() !== '' && isScheduleInFuture(existing)) {
        return existing;
    }

    return toPickerValue(defaultScheduleDate());
}

export default function PostPublishDialog({
    open,
    form,
    busy = false,
    disabled = false,
    onClose,
    onPublishNow,
    onSchedule,
}: PostPublishDialogProps) {
    const { boot, user, t } = useCanvas();
    const locale = user.canvas?.locale ?? boot.defaultLocale;
    const reducedMotion = useReducedMotion() === true;
    const animatePanel = shouldAnimateReveal({ reducedMotion, animate: true });
    const formScheduleValue = toDatetimeLocalValue(form.publishedAt);
    const initiallyScheduled = isScheduled(form);

    // Parent remounts via `key` when the dialog opens so mode/schedule seed from form.
    const [mode, setMode] = useState<PublishTimingMode>(initiallyScheduled ? 'later' : 'now');
    const [scheduleAt, setScheduleAt] = useState(() => seedScheduleValue(formScheduleValue));

    const readyToPublish = canPublishForm(form);
    const canSubmitLater = scheduleAt.trim() !== '' && isScheduleInFuture(scheduleAt);
    const canSubmit = !busy && !disabled && readyToPublish && (mode === 'now' || canSubmitLater);
    const scheduleOpen = mode === 'later';
    const durationS = animatePanel ? PILL_SLIDE_DURATION_S : 0;
    const durationMs = Math.round(durationS * 1000);
    const easeCss = 'cubic-bezier(0.2, 0, 0, 1)';

    async function handlePrimary() {
        if (!canSubmit) {
            return;
        }

        if (mode === 'now') {
            await onPublishNow();
            return;
        }

        await onSchedule(scheduleAt);
    }

    return (
        <Dialog
            open={open}
            onClose={() => {
                if (!busy) {
                    onClose();
                }
            }}
            size="xl"
            align="top"
            data-post-publish-dialog="true"
        >
            <div className="relative sm:px-2 sm:pt-2">
                <div className="absolute end-0 top-0 z-10 sm:end-2 sm:top-2">
                    <DialogCloseButton label={t('common.close')} disabled={busy} />
                </div>

                <div className="pe-10">
                    <DialogTitle className="sr-only">
                        {t('editor.publish_dialog_title', 'Looks good to me.')}
                    </DialogTitle>
                    <p
                        aria-hidden="true"
                        className="text-2xl/8 font-semibold tracking-tight text-emerald-600 sm:text-3xl/9 dark:text-emerald-400"
                    >
                        {t('editor.publish_dialog_title', 'Looks good to me.')}
                    </p>
                    <p className="mt-1 text-2xl/8 font-semibold tracking-tight text-zinc-950 sm:text-3xl/9 dark:text-white">
                        {t('editor.publish_dialog_subtitle', 'Choose when readers should see it.')}
                    </p>
                </div>
            </div>

            <DialogBody className="mt-8 space-y-5 sm:px-2" data-publish-timing-panel>
                {!readyToPublish ? (
                    <p
                        className="rounded-lg bg-amber-400/15 px-3 py-2 text-sm/6 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200"
                        data-publish-needs-title
                    >
                        {t('editor.publish_needs_title', 'Add a title before publishing.')}
                    </p>
                ) : null}

                <PillNav
                    value={mode}
                    onChange={setMode}
                    indicator="slide"
                    aria-label={t('editor.publish_timing_label', 'When to publish')}
                    className="w-full"
                >
                    <PillNavItem value="now" className="flex-1 justify-center" disabled={busy || disabled}>
                        {t('editor.publish_now', 'Publish now')}
                    </PillNavItem>
                    <PillNavItem value="later" className="flex-1 justify-center" disabled={busy || disabled}>
                        {t('editor.schedule_for_later', 'Schedule for later')}
                    </PillNavItem>
                </PillNav>

                {/*
                  Continuous expand/collapse (not mount/unmount):
                  - DateTimePicker stays mounted so the calendar never “pops” on first paint.
                  - Height uses 0fr→1fr in lockstep with the pill slide.
                  - Opacity softens the reveal so growth doesn’t feel hard-cut.
                */}
                <div className="min-w-0">
                    <div
                        className={clsx(
                            'grid',
                            animatePanel && 'transition-[grid-template-rows]',
                            scheduleOpen ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                        )}
                        style={
                            animatePanel
                                ? { transitionDuration: `${durationMs}ms`, transitionTimingFunction: easeCss }
                                : undefined
                        }
                        aria-hidden={scheduleOpen}
                    >
                        <div className="min-h-0 overflow-hidden">
                            <motion.p
                                className="text-sm/6 text-zinc-500 dark:text-zinc-400"
                                initial={false}
                                animate={{
                                    opacity: scheduleOpen ? 0 : 1,
                                }}
                                transition={{ duration: durationS, ease: [0.2, 0, 0, 1] }}
                            >
                                {t(
                                    'editor.publish_now_help',
                                    'The post goes live immediately for anyone with the public URL.'
                                )}
                            </motion.p>
                        </div>
                    </div>

                    <div
                        className={clsx(
                            'grid min-w-0',
                            animatePanel && 'transition-[grid-template-rows]',
                            scheduleOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        )}
                        style={
                            animatePanel
                                ? { transitionDuration: `${durationMs}ms`, transitionTimingFunction: easeCss }
                                : undefined
                        }
                        data-publish-schedule={scheduleOpen ? 'true' : 'false'}
                        aria-hidden={!scheduleOpen}
                    >
                        <div className="min-h-0 overflow-hidden">
                            <motion.div
                                className={clsx('min-w-0', !scheduleOpen && 'pointer-events-none')}
                                initial={false}
                                animate={{
                                    opacity: scheduleOpen ? 1 : 0,
                                    y: animatePanel ? (scheduleOpen ? 0 : 6) : 0,
                                }}
                                transition={{ duration: durationS, ease: [0.2, 0, 0, 1] }}
                            >
                                <DateTimePicker
                                    value={scheduleAt}
                                    disabled={busy || disabled || !scheduleOpen}
                                    locale={locale}
                                    data-publish-schedule-input=""
                                    labels={{
                                        time: t('editor.schedule_time', 'Time'),
                                        prevMonth: t('editor.schedule_prev_month', 'Previous month'),
                                        nextMonth: t('editor.schedule_next_month', 'Next month'),
                                        empty: t('editor.schedule_pick', 'Choose a date and time'),
                                        timezoneHint: t(
                                            'editor.schedule_timezone_hint',
                                            "Times use this device's local timezone."
                                        ),
                                        presets: {
                                            in_one_hour: t('editor.schedule_presets.in_one_hour', 'In 1 hour'),
                                            tomorrow_morning: t(
                                                'editor.schedule_presets.tomorrow_morning',
                                                'Tomorrow 9am'
                                            ),
                                            next_monday: t('editor.schedule_presets.next_monday', 'Next Monday'),
                                        },
                                    }}
                                    onChange={setScheduleAt}
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </DialogBody>

            <DialogActions className="sm:px-2">
                <Button type="button" plain disabled={busy} onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button
                    type="button"
                    color="dark/zinc"
                    disabled={!canSubmit}
                    data-publish-dialog-submit
                    onClick={() => void handlePrimary()}
                >
                    {busy
                        ? mode === 'later'
                            ? t('editor.scheduling')
                            : t('editor.publishing')
                        : mode === 'later'
                          ? t('editor.schedule')
                          : t('editor.publish')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
