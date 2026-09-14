import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api';
import { notifyWebhookTestError } from '@/lib/integrations/webhook-test-error';
import { toast } from '@/lib/toast';

vi.mock('@/lib/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const t = (key: string, replacementsOrFallback?: string | Record<string, string | number>, fallback?: string) =>
    typeof replacementsOrFallback === 'string' ? replacementsOrFallback : (fallback ?? key);

describe('notifyWebhookTestError', () => {
    it('prefers the delivery detail over the generic test-failed copy', () => {
        vi.mocked(toast.error).mockReset();

        notifyWebhookTestError(
            new ApiError(502, {
                message: 'The test webhook could not be delivered.',
                code: 'webhooks_test_failed',
                detail: 'Canvas webhook delivery failed with HTTP 405 for event [webhook.test].',
            }),
            t
        );

        expect(toast.error).toHaveBeenCalledWith(
            'Canvas webhook delivery failed with HTTP 405 for event [webhook.test].'
        );
    });
});
