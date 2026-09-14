import type { WebhookDeliveryStatus } from '@/lib/api/integrations';

export type WebhookDeliveryBadgeColor = 'zinc' | 'green' | 'red' | 'amber';

export function webhookDeliveryStatusColor(status: string | null | undefined): WebhookDeliveryBadgeColor {
    switch (status) {
        case 'success':
            return 'green';
        case 'failed':
            return 'red';
        case 'pending':
            return 'amber';
        default:
            return 'zinc';
    }
}

export function webhookDeliveryStatusDotClasses(status: string | null | undefined): {
    halo: string;
    core: string;
} {
    switch (status) {
        case 'success':
            return { halo: 'bg-emerald-500/25', core: 'bg-emerald-500' };
        case 'failed':
            return { halo: 'bg-red-500/25', core: 'bg-red-500' };
        case 'pending':
            return { halo: 'bg-amber-400/30', core: 'bg-amber-400' };
        default:
            return { halo: 'bg-zinc-400/25', core: 'bg-zinc-400' };
    }
}

export function isRetryableWebhookDelivery(status: string | null | undefined): boolean {
    return status === 'failed';
}

export function webhookDeliveryStatusLabelKey(status: string): string {
    switch (status as WebhookDeliveryStatus) {
        case 'success':
            return 'integrations.webhooks_deliveries_status_success';
        case 'failed':
            return 'integrations.webhooks_deliveries_status_failed';
        case 'pending':
            return 'integrations.webhooks_deliveries_status_pending';
        default:
            return 'integrations.webhooks_deliveries_status_pending';
    }
}
