import { useState } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Description, Field, Fieldset, Label } from '@/components/fieldset';
import { useCanvas } from '@/hooks/useCanvas';
import { isPublished, type PostFormState } from '@/lib/posts/form';

type PublishPanelProps = {
    form: PostFormState;
    onPublish: () => void | Promise<void>;
    onUnpublish: () => void | Promise<void>;
    onDelete?: () => void;
    disabled?: boolean;
    deleting?: boolean;
};

export default function PublishPanel({
    form,
    onPublish,
    onUnpublish,
    onDelete,
    disabled = false,
    deleting = false,
}: PublishPanelProps) {
    const { t } = useCanvas();
    const published = isPublished(form);
    const [busyAction, setBusyAction] = useState<'publish' | 'unpublish' | null>(null);
    const busy = disabled || deleting || busyAction !== null;

    async function handlePublish() {
        if (busy) {
            return;
        }

        setBusyAction('publish');

        try {
            await onPublish();
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
        } finally {
            setBusyAction(null);
        }
    }

    return (
        <Fieldset className="min-w-0 rounded-lg border border-zinc-950/10 p-4 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5">
            <div className="flex min-w-0 items-center justify-between gap-3">
                <Badge color={published ? 'green' : 'amber'}>
                    {published ? t('editor.published_badge') : t('editor.draft_badge')}
                </Badge>
            </div>

            <Field className="mt-4 min-w-0">
                <Label>{t('editor.visibility')}</Label>
                <Description>{published ? t('editor.visibility_live') : t('editor.visibility_draft')}</Description>
                <div className="mt-3 flex flex-wrap gap-2">
                    {published ? (
                        <Button type="button" outline disabled={busy} onClick={() => void handleUnpublish()}>
                            {busyAction === 'unpublish' ? t('editor.unpublishing') : t('editor.unpublish')}
                        </Button>
                    ) : (
                        <Button type="button" color="dark/zinc" disabled={busy} onClick={() => void handlePublish()}>
                            {busyAction === 'publish' ? t('editor.publishing') : t('editor.publish')}
                        </Button>
                    )}
                </div>
            </Field>

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
