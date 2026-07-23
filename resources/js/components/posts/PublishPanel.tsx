import { useState } from 'react';

import { Button } from '@/components/button';
import { Description, Field, Fieldset, Label } from '@/components/fieldset';
import { useCanvas } from '@/hooks/useCanvas';
import { isPublished, isScheduled, publishStatus, type PostFormState } from '@/lib/posts/form';

type PublishPanelProps = {
    form: PostFormState;
    hasPendingChanges?: boolean;
    onDiscard?: () => void | Promise<void>;
    onUnpublish: () => void | Promise<void>;
    /** Opens the top-bar publish dialog (e.g. reschedule). */
    onChangeSchedule?: () => void;
    onDelete?: () => void;
    disabled?: boolean;
    deleting?: boolean;
};

function formatScheduledDate(value: string | null, locale: string): string {
    if (value === null || value.trim() === '') {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function PublishPanel({
    form,
    hasPendingChanges = false,
    onDiscard,
    onUnpublish,
    onChangeSchedule,
    onDelete,
    disabled = false,
    deleting = false,
}: PublishPanelProps) {
    const { boot, user, t } = useCanvas();
    const locale = user.canvas?.locale ?? boot.defaultLocale;
    const status = publishStatus(form);
    const published = isPublished(form);
    const scheduled = isScheduled(form);
    const [busyAction, setBusyAction] = useState<'discard' | 'unpublish' | null>(null);
    const busy = disabled || deleting || busyAction !== null;

    const scheduledDateLabel = formatScheduledDate(form.publishedAt, locale);
    const statusDescription =
        status === 'published' && hasPendingChanges
            ? t(
                  'editor.visibility_pending',
                  'Live on your site. Edits stay private until you update the published post.'
              )
            : status === 'published'
              ? t('editor.visibility_live', 'Live on your site.')
              : status === 'scheduled'
                ? t('editor.visibility_scheduled', { date: scheduledDateLabel }, 'Will go live on :date.')
                : t(
                      'editor.visibility_publish_help',
                      'Not live yet. Use Publish in the top bar to go live or schedule.'
                  );

    async function handleUnpublish() {
        if (busy) {
            return;
        }

        setBusyAction('unpublish');

        try {
            await onUnpublish();
        } finally {
            setBusyAction(null);
        }
    }

    async function handleDiscard() {
        if (busy || onDiscard === undefined) {
            return;
        }

        setBusyAction('discard');

        try {
            await onDiscard();
        } finally {
            setBusyAction(null);
        }
    }

    return (
        <div className="min-w-0 space-y-6">
            <Fieldset className="min-w-0">
                <Description data-publish-status-description="true">{statusDescription}</Description>

                <div className="mt-3 flex flex-wrap gap-2">
                    {published && hasPendingChanges && onDiscard !== undefined ? (
                        <Button
                            type="button"
                            outline
                            disabled={busy}
                            data-publish-discard
                            onClick={() => void handleDiscard()}
                        >
                            {busyAction === 'discard'
                                ? t('editor.discarding', 'Discarding…')
                                : t('editor.discard_changes', 'Discard changes')}
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

                    {scheduled && onChangeSchedule !== undefined ? (
                        <Button
                            type="button"
                            plain
                            disabled={busy}
                            data-publish-change-schedule
                            onClick={onChangeSchedule}
                        >
                            {t('editor.change_schedule', 'Change schedule…')}
                        </Button>
                    ) : null}
                </div>
            </Fieldset>

            {onDelete !== undefined ? (
                <Fieldset className="min-w-0 rounded-lg border border-zinc-950/10 p-4 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5">
                    <Field className="min-w-0">
                        <Label>{t('editor.danger_zone')}</Label>
                        <Description>{t('editor.danger_zone_help')}</Description>
                        <div className="mt-3">
                            <Button type="button" outline color="red" disabled={busy} onClick={onDelete}>
                                {deleting ? t('common.deleting') : t('editor.delete_post')}
                            </Button>
                        </div>
                    </Field>
                </Fieldset>
            ) : null}
        </div>
    );
}
