import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Description, Field, Fieldset, Label } from '@/components/fieldset';
import { isPublished, publishFormState, unpublishFormState, type PostFormState } from '@/lib/posts/form';

type PublishPanelProps = {
    form: PostFormState;
    onChange: (form: PostFormState) => void;
    onSaveNow: () => void;
    saveStatus: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
    disabled?: boolean;
};

function saveStatusLabel(status: PublishPanelProps['saveStatus']): string {
    switch (status) {
        case 'pending':
            return 'Unsaved changes';
        case 'saving':
            return 'Saving…';
        case 'saved':
            return 'Saved';
        case 'error':
            return 'Save failed';
        default:
            return '';
    }
}

export default function PublishPanel({ form, onChange, onSaveNow, saveStatus, disabled = false }: PublishPanelProps) {
    const published = isPublished(form);
    const statusText = saveStatusLabel(saveStatus);

    return (
        <Fieldset className="rounded-lg border border-zinc-950/10 p-4 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5">
            <div className="flex items-center justify-between gap-3">
                <Badge color={published ? 'green' : 'amber'}>{published ? 'Published' : 'Draft'}</Badge>
                {statusText ? (
                    <span
                        className={
                            saveStatus === 'error'
                                ? 'text-sm text-red-600 dark:text-red-500'
                                : 'text-sm text-zinc-500 dark:text-zinc-400'
                        }
                    >
                        {statusText}
                    </span>
                ) : null}
            </div>

            <Field className="mt-4">
                <Label>Visibility</Label>
                <Description>
                    {published ? 'This post is visible to readers.' : 'Save as draft until you are ready to publish.'}
                </Description>
                <div className="mt-3 flex flex-wrap gap-2">
                    {published ? (
                        <Button
                            type="button"
                            outline
                            disabled={disabled || saveStatus === 'saving'}
                            onClick={() => onChange(unpublishFormState(form))}
                        >
                            Unpublish
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            color="dark/zinc"
                            disabled={disabled || saveStatus === 'saving'}
                            onClick={() => onChange(publishFormState(form))}
                        >
                            Publish
                        </Button>
                    )}
                    <Button type="button" plain disabled={disabled || saveStatus === 'saving'} onClick={onSaveNow}>
                        Save now
                    </Button>
                </div>
            </Field>
        </Fieldset>
    );
}
