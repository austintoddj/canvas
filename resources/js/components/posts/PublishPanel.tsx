import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Description, Field, Fieldset, Label } from '@/components/fieldset';
import {
    isPublished,
    publishFormState,
    saveStatusLabel,
    unpublishFormState,
    type PostFormState,
    type PostSaveStatus,
} from '@/lib/posts/form';

type PublishPanelProps = {
    form: PostFormState;
    onChange: (form: PostFormState) => void;
    onSaveNow: () => void;
    saveStatus: PostSaveStatus;
    disabled?: boolean;
};

export default function PublishPanel({ form, onChange, onSaveNow, saveStatus, disabled = false }: PublishPanelProps) {
    const published = isPublished(form);
    const statusText = saveStatusLabel(saveStatus) ?? '';

    return (
        <Fieldset className="rounded-lg border border-zinc-950/10 p-4 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5">
            <div className="flex items-center justify-between gap-3">
                <Badge color={published ? 'green' : 'amber'}>{published ? 'Published' : 'Draft'}</Badge>
                {statusText ? (
                    <span
                        className={
                            saveStatus === 'error'
                                ? 'text-sm text-canvas-danger dark:text-canvas-danger-dark'
                                : 'text-sm text-canvas-muted dark:text-canvas-muted-dark'
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
