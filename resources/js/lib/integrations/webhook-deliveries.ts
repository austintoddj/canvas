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
