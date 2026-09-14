import { ApiError, apiErrorCode, apiErrorDetail } from '@/lib/api';
import type { Translator } from '@/lib/i18n';
import { toast } from '@/lib/toast';

export function notifyWebhookTestError(error: unknown, t: Translator['t']): void {
    if (error instanceof ApiError) {
        const code = apiErrorCode(error);

        if (code === 'webhooks_not_configured') {
            toast.error(t('integrations.webhooks_not_configured', 'Configure webhooks before sending a test.'));
            return;
        }

        if (code === 'webhooks_test_failed' || error.status === 502) {
            toast.error(
                apiErrorDetail(error) ??
                    t('integrations.webhooks_test_failed', 'The test webhook could not be delivered.')
            );
            return;
        }
    }

    toast.error(t('integrations.webhooks_test_error', 'Unable to send a test webhook.'));
}
