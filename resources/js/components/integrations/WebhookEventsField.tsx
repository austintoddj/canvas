import { useMemo, useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';

import { Checkbox, CheckboxField } from '@/components/checkbox';
import { Description, Label } from '@/components/fieldset';
import { useCanvas } from '@/hooks/useCanvas';
import type { WebhookEventOption } from '@/lib/api/integrations';
import { groupWebhookEventOptions, webhookEventGroupLabelFallback } from '@/lib/integrations/webhook-event-groups';
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
    const groups = useMemo(() => groupWebhookEventOptions(options), [options]);
    const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

    function toggleEvent(eventId: string, checked: boolean) {
        if (checked) {
            if (selected.has(eventId)) {
                return;
            }

            onChange([...value, eventId]);
            return;
        }

        onChange(value.filter((id) => id !== eventId));
    }

    function setGroup(eventIds: string[], checked: boolean) {
        if (checked) {
            const next = new Set(value);

            for (const id of eventIds) {
                next.add(id);
            }

            onChange([...next]);
            return;
        }

        const remove = new Set(eventIds);
        onChange(value.filter((id) => !remove.has(id)));
    }

    function toggleCollapsed(groupId: string) {
        setCollapsed((current) => {
            const next = new Set(current);

            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }

            return next;
        });
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
            <div className="divide-y divide-zinc-950/10 dark:divide-white/10">
                {groups.map((group) => {
                    const eventIds = group.events.map((option) => option.id);
                    const selectedCount = eventIds.filter((id) => selected.has(id)).length;
                    const total = eventIds.length;
                    const allSelected = total > 0 && selectedCount === total;
                    const partiallySelected = selectedCount > 0 && !allSelected;
                    const expanded = !collapsed.has(group.id);
                    const panelId = `webhook-event-group-${group.id}`;
                    const label = t(
                        `integrations.webhooks_event_group_${group.id}`,
                        webhookEventGroupLabelFallback(group.id)
                    );

                    return (
                        <div
                            key={group.id}
                            data-webhook-event-group={group.id}
                            data-expanded={expanded ? 'true' : 'false'}
                        >
                            <div className="grid grid-cols-[1.75rem_auto_minmax(0,1fr)] items-center gap-x-3 px-3 py-2.5 hover:bg-zinc-950/[0.02] dark:hover:bg-white/[0.02]">
                                <button
                                    type="button"
                                    className="inline-flex size-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-950/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                                    aria-expanded={expanded}
                                    aria-controls={panelId}
                                    disabled={disabled}
                                    onClick={() => toggleCollapsed(group.id)}
                                    data-webhook-event-group-toggle={group.id}
                                >
                                    <IconChevronDown
                                        className={cn('size-4 shrink-0 transition-transform', expanded && 'rotate-180')}
                                        aria-hidden="true"
                                    />
                                    <span className="sr-only">
                                        {label} ({total})
                                    </span>
                                </button>

                                <Checkbox
                                    color="dark/zinc"
                                    checked={allSelected}
                                    indeterminate={partiallySelected}
                                    disabled={disabled || total === 0}
                                    aria-label={label}
                                    onChange={(checked) => setGroup(eventIds, checked)}
                                    data-webhook-events-group-select={group.id}
                                />

                                <button
                                    type="button"
                                    className="flex min-w-0 items-center justify-between gap-3 text-left"
                                    aria-expanded={expanded}
                                    aria-controls={panelId}
                                    disabled={disabled}
                                    onClick={() => toggleCollapsed(group.id)}
                                >
                                    <span className="min-w-0 text-sm font-medium text-zinc-950 dark:text-white">
                                        {label}{' '}
                                        <span className="font-normal text-zinc-500 dark:text-zinc-400">({total})</span>
                                    </span>
                                    {allSelected ? (
                                        <span
                                            className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"
                                            data-webhook-events-selected-count="true"
                                        >
                                            {t('integrations.webhooks_events_all_selected', 'All selected')}
                                        </span>
                                    ) : selectedCount > 0 ? (
                                        <span
                                            className="shrink-0 text-xs/5 tabular-nums text-zinc-500 dark:text-zinc-400"
                                            aria-live="polite"
                                            data-webhook-events-selected-count="true"
                                        >
                                            {t(
                                                'integrations.webhooks_events_selected_count',
                                                { count: selectedCount, total },
                                                ':count of :total selected'
                                            )}
                                        </span>
                                    ) : null}
                                </button>
                            </div>

                            <div
                                id={panelId}
                                hidden={!expanded}
                                className="grid grid-cols-[1.75rem_auto_minmax(0,1fr)] gap-x-3 px-3 pb-3"
                            >
                                <div className="col-start-3 space-y-2.5">
                                    {group.events.map((option) => {
                                        const isChecked = selected.has(option.id);

                                        return (
                                            <CheckboxField key={option.id} disabled={disabled}>
                                                <Checkbox
                                                    color="dark/zinc"
                                                    checked={isChecked}
                                                    disabled={disabled}
                                                    onChange={(next) => toggleEvent(option.id, next)}
                                                    data-webhook-event={option.id}
                                                />
                                                <Label className="cursor-pointer">
                                                    <span className="font-medium">{option.label}</span>
                                                    <span className="ml-1.5 font-mono text-xs font-normal text-zinc-400 dark:text-zinc-500">
                                                        {option.id}
                                                    </span>
                                                </Label>
                                                {option.description ? (
                                                    <Description className="line-clamp-2">
                                                        {option.description}
                                                    </Description>
                                                ) : null}
                                            </CheckboxField>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
