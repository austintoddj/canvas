import { describe, expect, it } from 'vitest';

import {
    isRetryableWebhookDelivery,
    webhookDeliveryStatusColor,
    webhookDeliveryStatusDotClasses,
    webhookDeliveryStatusLabelKey,
} from '@/lib/integrations/webhook-deliveries';

describe('webhook delivery helpers', () => {
    it('maps status to badge colors', () => {
        expect(webhookDeliveryStatusColor('success')).toBe('green');
        expect(webhookDeliveryStatusColor('failed')).toBe('red');
        expect(webhookDeliveryStatusColor('pending')).toBe('amber');
        expect(webhookDeliveryStatusColor('unknown')).toBe('zinc');
    });

    it('maps status to log-row dot classes', () => {
        expect(webhookDeliveryStatusDotClasses('success')).toEqual({
            halo: 'bg-emerald-500/25',
            core: 'bg-emerald-500',
        });
        expect(webhookDeliveryStatusDotClasses('failed')).toEqual({
            halo: 'bg-red-500/25',
            core: 'bg-red-500',
        });
        expect(webhookDeliveryStatusDotClasses('pending')).toEqual({
            halo: 'bg-amber-400/30',
            core: 'bg-amber-400',
        });
        expect(webhookDeliveryStatusDotClasses('unknown')).toEqual({
            halo: 'bg-zinc-400/25',
            core: 'bg-zinc-400',
        });
    });

    it('only failed deliveries are retryable', () => {
        expect(isRetryableWebhookDelivery('failed')).toBe(true);
        expect(isRetryableWebhookDelivery('success')).toBe(false);
        expect(isRetryableWebhookDelivery('pending')).toBe(false);
    });

    it('returns status label translation keys', () => {
        expect(webhookDeliveryStatusLabelKey('success')).toBe('integrations.webhooks_deliveries_status_success');
        expect(webhookDeliveryStatusLabelKey('failed')).toBe('integrations.webhooks_deliveries_status_failed');
        expect(webhookDeliveryStatusLabelKey('pending')).toBe('integrations.webhooks_deliveries_status_pending');
    });
});
