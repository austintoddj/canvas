import { useState } from 'react';
import { IconCalendar } from '@tabler/icons-react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import DateTimePicker from '@/components/DateTimePicker';
import { Description, Field, Fieldset, Label } from '@/components/fieldset';
import { useCanvas } from '@/hooks/useCanvas';
import { defaultScheduleDate, isScheduleInFuture, toPickerValue } from '@/lib/datetime-picker';
import { isPublished, isScheduled, publishStatus, toDatetimeLocalValue, type PostFormState } from '@/lib/posts/form';

type PublishPanelProps = {
    form: PostFormState;
    onPublish: () => void | Promise<void>;
    onSchedule: (datetimeLocal: string) => void | Promise<void>;
    onUnpublish: () => void | Promise<void>;
    onDelete?: () => void;
    disabled?: boolean;
    deleting?: boolean;
};

function seedScheduleValue(existing: string): string {
    if (existing.trim() !== '' && isScheduleInFuture(existing)) {
        return existing;
    }

    return toPickerValue(defaultScheduleDate());
}

export default function PublishPanel({
    form,
    onPublish,
    onSchedule,
    onUnpublish,
    onDelete,
    disabled = false,
    deleting = false,
}: PublishPanelProps) {
    const { boot, user, t } = useCanvas();
    const locale = user.canvas?.locale ?? boot.defaultLocale;
    const status = publishStatus(form);
    const published = isPublished(form);
    const scheduled = isScheduled(form);
    const formScheduleValue = toDatetimeLocalValue(form.publishedAt);
    const [scheduleDraft, setScheduleDraft] = useState<string | null>(null);
    const [syncedPublishedAt, setSyncedPublishedAt] = useState(form.publishedAt);
    const [scheduleExpanded, setScheduleExpanded] = useState(scheduled);
    const [busyAction, setBusyAction] = useState<'publish' | 'schedule' | 'unpublish' | null>(null);
    const busy = disabled || deleting || busyAction !== null;

    if (form.publishedAt !== syncedPublishedAt) {
        const wasScheduled = isScheduled({ ...form, publishedAt: syncedPublishedAt });
        const nowScheduled = isScheduled(form);

        setSyncedPublishedAt(form.publishedAt);
        setScheduleDraft(nowScheduled ? seedScheduleValue(toDatetimeLocalValue(form.publishedAt)) : null);

        if (nowScheduled && !wasScheduled) {
            setScheduleExpanded(true);
        }

        if (!nowScheduled && !isPublished(form)) {
            setScheduleExpanded(false);
        }
    }

    if (scheduleExpanded && scheduleDraft === null) {
        setScheduleDraft(seedScheduleValue(formScheduleValue));
    }

    const scheduleAt = scheduleDraft ?? formScheduleValue;
    const canSubmitSchedule = scheduleAt.trim() !== '' && isScheduleInFuture(scheduleAt);

    const badgeColor = status === 'published' ? 'green' : status === 'scheduled' ? 'blue' : 'amber';
    const badgeLabel =
        status === 'published'
            ? t('editor.published_badge')
            : status === 'scheduled'
              ? t('editor.scheduled_badge')
              : t('editor.draft_badge');
    const visibilityDescription =
        status === 'published'
            ? t('editor.visibility_live')
            : status === 'scheduled'
              ? t('editor.visibility_scheduled')
              : t('editor.visibility_draft');

    function openSchedule() {
        setScheduleDraft(seedScheduleValue(formScheduleValue));
        setScheduleExpanded(true);
    }

    function closeSchedule() {
        setScheduleExpanded(false);
        setScheduleDraft(null);
    }

    async function handlePublish() {
        if (busy || scheduleExpanded) {
            return;
        }

        setBusyAction('publish');

        try {
            await onPublish();
            setScheduleExpanded(false);
            setScheduleDraft(null);
        } finally {
            setBusyAction(null);
        }
    }

    async function handleSchedule() {
        if (busy || !canSubmitSchedule) {
            return;
        }

        setBusyAction('schedule');

        try {
            await onSchedule(scheduleAt);
            setScheduleExpanded(true);
            setScheduleDraft(null);
        } finally {
            setBusyAction(null);
        }
    }

    async function handleUnpublish() {
        if (busy) {
            return;
        }

        setBusyAction('unpublish');

        try {
            await onUnpublish();
            setScheduleExpanded(false);
            setScheduleDraft(null);
        } finally {
            setBusyAction(null);
        }
    }

    return (
        <Fieldset className="min-w-0 rounded-lg border border-zinc-950/10 p-4 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5">
            <div className="flex min-w-0 items-center justify-between gap-3">
                <Badge color={badgeColor} data-publish-status={status}>
                    {badgeLabel}
                </Badge>
            </div>

            <Field className="mt-4 min-w-0">
                <Label>{t('editor.visibility')}</Label>
                <Description>{visibilityDescription}</Description>
                <div className="mt-3 flex flex-wrap gap-2">
                    {!published ? (
                        scheduleExpanded ? (
                            <Button type="button" outline disabled>
                                {t('editor.publish')}
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                color="dark/zinc"
                                disabled={busy}
                                onClick={() => void handlePublish()}
                            >
                                {busyAction === 'publish' ? t('editor.publishing') : t('editor.publish')}
                            </Button>
                        )
                    ) : null}

                    {!published && !scheduleExpanded ? (
                        <Button
                            type="button"
                            outline
                            disabled={busy}
                            aria-expanded={false}
                            data-publish-schedule-toggle
                            onClick={openSchedule}
                        >
                            <IconCalendar data-slot="icon" />
                            {t('editor.schedule')}
                        </Button>
                    ) : null}

                    {!published && scheduleExpanded && !scheduled ? (
                        <Button
                            type="button"
                            outline
                            disabled={busy}
                            aria-expanded
                            data-publish-schedule-toggle
                            onClick={closeSchedule}
                        >
                            {t('common.cancel')}
                        </Button>
                    ) : null}

                    {published || scheduled ? (
                        <Button type="button" outline disabled={busy} onClick={() => void handleUnpublish()}>
                            {busyAction === 'unpublish'
                                ? t('editor.unpublishing')
                                : scheduled
                                  ? t('editor.cancel_schedule')
                                  : t('editor.unpublish')}
                        </Button>
                    ) : null}
                </div>
            </Field>

            {scheduleExpanded && !published ? (
                <Field className="mt-4 min-w-0" data-publish-schedule>
                    <Label>{t('editor.schedule_for')}</Label>
                    <Description>{t('editor.schedule_for_help')}</Description>
                    <div className="mt-3 space-y-3">
                        <DateTimePicker
                            value={scheduleAt}
                            disabled={busy}
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
                                    tomorrow_morning: t('editor.schedule_presets.tomorrow_morning', 'Tomorrow 9am'),
                                    next_monday: t('editor.schedule_presets.next_monday', 'Next Monday'),
                                },
                            }}
                            onChange={setScheduleDraft}
                        />
                        <Button
                            type="button"
                            color="dark/zinc"
                            className="w-full sm:w-auto"
                            disabled={busy || !canSubmitSchedule}
                            onClick={() => void handleSchedule()}
                            data-publish-schedule-submit
                        >
                            <IconCalendar data-slot="icon" />
                            {busyAction === 'schedule' ? t('editor.scheduling') : t('editor.schedule')}
                        </Button>
                    </div>
                </Field>
            ) : null}

            {onDelete !== undefined ? (
                <Field className="mt-6 min-w-0 border-t border-zinc-950/10 pt-4 dark:border-white/10">
                    <Label>{t('editor.danger_zone')}</Label>
                    <Description>{t('editor.danger_zone_help')}</Description>
                    <div className="mt-3">
                        <Button type="button" outline color="red" disabled={busy} onClick={onDelete}>
                            {deleting ? t('common.deleting') : t('editor.delete_post')}
                        </Button>
                    </div>
                </Field>
            ) : null}
        </Fieldset>
    );
}
