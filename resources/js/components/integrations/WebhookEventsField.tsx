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
    const total = allIds.length;
    const selectedCount = value.length;
    const allSelected = total > 0 && allIds.every((id) => selected.has(id));
    const partiallySelected = selectedCount > 0 && !allSelected;

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

    function setAll(checked: boolean) {
        onChange(checked ? allIds : []);
    }

    return (
        <div
            data-slot="control"
            className={cn(
                'overflow-hidden rounded-lg border border-zinc-950/10 dark:border-white/10',
                invalid && 'border-red-500 dark:border-red-600',
                className
            )}
            data-webhook-events="true"
            data-invalid={invalid ? true : undefined}
        >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-950/10 bg-zinc-50/80 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                <CheckboxField disabled={disabled || total === 0} className="min-w-0">
                    <Checkbox
                        color="dark/zinc"
                        checked={allSelected}
                        indeterminate={partiallySelected}
                        disabled={disabled || total === 0}
                        onChange={setAll}
                        data-webhook-events-select-all="true"
                    />
                    <Label className="cursor-pointer font-medium">
                        {t('integrations.webhooks_events_select_all', 'Select all')}
                    </Label>
                </CheckboxField>

                <p
                    className="shrink-0 text-xs/5 tabular-nums text-zinc-500 dark:text-zinc-400"
                    aria-live="polite"
                    data-webhook-events-selected-count="true"
                >
                    {t(
                        'integrations.webhooks_events_selected_count',
                        { count: selectedCount, total },
                        ':count of :total selected'
                    )}
                </p>
            </div>

            <CheckboxGroup className="p-3.5 sm:p-4">
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
