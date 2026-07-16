import { useState } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Description, Field, Fieldset, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { useCanvas } from '@/hooks/useCanvas';
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

export default function PublishPanel({
    form,
    onPublish,
    onSchedule,
    onUnpublish,
    onDelete,
    disabled = false,
    deleting = false,
}: PublishPanelProps) {
    const { t } = useCanvas();
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
        setScheduleDraft(null);

        if (nowScheduled && !wasScheduled) {
            setScheduleExpanded(true);
        }

        if (!nowScheduled && !isPublished(form)) {
            setScheduleExpanded(false);
        }
    }

    const scheduleAt = scheduleDraft ?? formScheduleValue;

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

    async function handlePublish() {
        if (busy) {
            return;
        }

        setBusyAction('publish');

        try {
            await onPublish();
            setScheduleExpanded(false);
        } finally {
            setBusyAction(null);
        }
    }

    async function handleSchedule() {
        if (busy || scheduleAt.trim() === '') {
            return;
        }

        setBusyAction('schedule');

        try {
            await onSchedule(scheduleAt);
            setScheduleExpanded(true);
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
                        <Button type="button" color="dark/zinc" disabled={busy} onClick={() => void handlePublish()}>
                            {busyAction === 'publish' ? t('editor.publishing') : t('editor.publish')}
                        </Button>
                    ) : null}
                    {!published ? (
                        <Button
                            type="button"
                            outline
                            disabled={busy}
                            aria-expanded={scheduleExpanded}
                            data-publish-schedule-toggle
                            onClick={() => setScheduleExpanded((open) => !open)}
                        >
                            {t('editor.schedule')}
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
                    <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            type="datetime-local"
                            name="published_at"
                            value={scheduleAt}
                            disabled={busy}
                            onChange={(event) => setScheduleDraft(event.target.value)}
                            data-publish-schedule-input
                        />
                        <Button
                            type="button"
                            color="dark/zinc"
                            disabled={busy || scheduleAt.trim() === ''}
                            onClick={() => void handleSchedule()}
                            data-publish-schedule-submit
                        >
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
