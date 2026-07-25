import { Checkbox, CheckboxField, CheckboxGroup } from '@/components/checkbox';
import { Description, Label } from '@/components/fieldset';
import { useCanvas } from '@/hooks/useCanvas';
import type { WebhookEventOption } from '@/lib/api/integrations';
import { cn } from '@/lib/utils';

type WebhookEventsFieldProps = {
    options: WebhookEventOption[];
    value: string[];
    onChange: (events: string[]) => void;
    disabled?: boolean;
    invalid?: boolean;
    className?: string;
};

export function WebhookEventsField({
    options,
    value,
    onChange,
    disabled = false,
    invalid = false,
    className,
}: WebhookEventsFieldProps) {
    const { t } = useCanvas();
    const selected = new Set(value);
    const allIds = options.map((option) => option.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
    const noneSelected = value.length === 0;

    function toggle(eventId: string, checked: boolean) {
        if (checked) {
            if (selected.has(eventId)) {
                return;
            }

            onChange([...value, eventId]);
            return;
        }

        onChange(value.filter((id) => id !== eventId));
    }

    function selectAll() {
        onChange(allIds);
    }

    function clearAll() {
        onChange([]);
    }

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <button
                    type="button"
                    className="text-sm font-medium text-zinc-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300"
                    disabled={disabled || allSelected}
                    onClick={selectAll}
                    data-webhook-events-select-all="true"
                >
                    {t('integrations.webhooks_events_select_all', 'Select all')}
                </button>
                <button
                    type="button"
                    className="text-sm font-medium text-zinc-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300"
                    disabled={disabled || noneSelected}
                    onClick={clearAll}
                    data-webhook-events-clear="true"
                >
                    {t('integrations.webhooks_events_clear', 'Clear')}
                </button>
            </div>

            <CheckboxGroup
                className={cn(
                    'rounded-lg border border-zinc-950/10 p-3 dark:border-white/10',
                    invalid && 'border-red-500 dark:border-red-600'
                )}
                data-webhook-events="true"
                data-invalid={invalid ? true : undefined}
            >
                {options.map((option) => {
                    const isChecked = selected.has(option.id);

                    return (
                        <CheckboxField key={option.id} disabled={disabled}>
                            <Checkbox
                                color="dark/zinc"
                                checked={isChecked}
                                disabled={disabled}
                                onChange={(next) => toggle(option.id, next)}
                                data-webhook-event={option.id}
                            />
                            <Label className="cursor-pointer">{option.label}</Label>
                            <Description>
                                <span className="font-mono text-xs/5">{option.id}</span>
                                {option.description ? (
                                    <span className="mt-0.5 block text-xs/5">{option.description}</span>
                                ) : null}
                            </Description>
                        </CheckboxField>
                    );
                })}
            </CheckboxGroup>
        </div>
    );
}
