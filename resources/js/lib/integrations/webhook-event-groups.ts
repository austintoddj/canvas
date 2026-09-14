import type { WebhookEventOption } from '@/lib/api/integrations';

export type WebhookEventGroup = {
    id: string;
    events: WebhookEventOption[];
};

/**
 * Resource prefix for an event id (`post.published` → `post`).
 * Group labels use `integrations.webhooks_event_group_${id}`.
 */
export function webhookEventGroupId(eventId: string): string {
    const separator = eventId.indexOf('.');

    if (separator <= 0) {
        return eventId;
    }

    return eventId.slice(0, separator);
}

export function groupWebhookEventOptions(options: WebhookEventOption[]): WebhookEventGroup[] {
    const groups: WebhookEventGroup[] = [];
    const indexById = new Map<string, number>();

    for (const option of options) {
        const id = webhookEventGroupId(option.id);
        const existing = indexById.get(id);

        if (existing === undefined) {
            indexById.set(id, groups.length);
            groups.push({ id, events: [option] });
            continue;
        }

        const group = groups[existing];

        if (group === undefined) {
            continue;
        }

        group.events.push(option);
    }

    return groups;
}

export function webhookEventGroupLabelFallback(id: string): string {
    if (id === '') {
        return id;
    }

    return id.slice(0, 1).toUpperCase() + id.slice(1);
}
