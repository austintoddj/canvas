import { Checkbox, CheckboxField, CheckboxGroup } from '@/components/checkbox';
import { Description, Label } from '@/components/fieldset';
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
    const selected = new Set(value);

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

    return (
        <CheckboxGroup
            className={cn(
                'rounded-lg border border-zinc-950/10 p-3 dark:border-white/10',
                invalid && 'border-red-500 dark:border-red-600',
                className
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
                        <Description className="font-mono text-xs/5">{option.id}</Description>
                    </CheckboxField>
                );
            })}
        </CheckboxGroup>
    );
}
