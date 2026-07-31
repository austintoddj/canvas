import { describe, expect, it } from 'vitest';

import {
    isRetryableWebhookDelivery,
    webhookDeliveryStatusColor,
    webhookDeliveryStatusLabelKey,
} from '@/lib/integrations/webhook-deliveries';

describe('webhook delivery helpers', () => {
    it('maps status to badge colors', () => {
        expect(webhookDeliveryStatusColor('success')).toBe('green');
        expect(webhookDeliveryStatusColor('failed')).toBe('red');
        expect(webhookDeliveryStatusColor('pending')).toBe('amber');
        expect(webhookDeliveryStatusColor('unknown')).toBe('zinc');
    });

    it('only failed deliveries are retryable', () => {
        expect(isRetryableWebhookDelivery('failed')).toBe(true);
        expect(isRetryableWebhookDelivery('success')).toBe(false);
        expect(isRetryableWebhookDelivery('pending')).toBe(false);
    });

    it('returns status label translation keys', () => {
        expect(webhookDeliveryStatusLabelKey('success')).toBe(
            'integrations.webhooks_deliveries_status_success'
        );
        expect(webhookDeliveryStatusLabelKey('failed')).toBe(
            'integrations.webhooks_deliveries_status_failed'
        );
        expect(webhookDeliveryStatusLabelKey('pending')).toBe(
            'integrations.webhooks_deliveries_status_pending'
        );
    });
});
