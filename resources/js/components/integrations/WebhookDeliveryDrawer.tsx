import { useState } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/description-list';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { SideDrawer } from '@/components/SideDrawer';
import { useCanvas } from '@/hooks/useCanvas';
import { ApiError, apiErrorCode } from '@/lib/api';
import { integrationsApi, type WebhookDelivery } from '@/lib/api/integrations';
import {
    isRetryableWebhookDelivery,
    webhookDeliveryStatusColor,
    webhookDeliveryStatusLabelKey,
} from '@/lib/integrations/webhook-deliveries';
import { toast } from '@/lib/toast';

type DeliveryTab = 'summary' | 'payload';

type WebhookDeliveryDrawerProps = {
    open: boolean;
    delivery: WebhookDelivery | null;
    onClose: () => void;
    onRetried?: (delivery: WebhookDelivery) => void;
};

function formatTimestamp(value: string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString();
}

function payloadJson(payload: WebhookDelivery['payload']): string | null {
    if (payload === null) {
        return null;
    }

    return JSON.stringify(payload, null, 2);
}

export function WebhookDeliveryDrawer({ open, delivery, onClose, onRetried }: WebhookDeliveryDrawerProps) {
    const { t } = useCanvas();
    const deliveryId = delivery?.id ?? null;
    const [activeDeliveryId, setActiveDeliveryId] = useState(deliveryId);
    const [tab, setTab] = useState<DeliveryTab>('summary');
    const [retrying, setRetrying] = useState(false);

    if (deliveryId !== activeDeliveryId) {
        setActiveDeliveryId(deliveryId);
        setTab('summary');
        setRetrying(false);
    }

    async function copyValue(value: string, successKey: string, successFallback: string) {
        if (typeof navigator.clipboard?.writeText !== 'function') {
            toast.error(t('integrations.webhooks_delivery_copy_error', 'Unable to copy.'));

            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            toast.success(t(successKey, successFallback));
        } catch {
            toast.error(t('integrations.webhooks_delivery_copy_error', 'Unable to copy.'));
        }
    }

    async function handleRetry() {
        if (delivery === null || retrying || !isRetryableWebhookDelivery(delivery.status)) {
            return;
        }

        setRetrying(true);

        try {
            const result = await integrationsApi.retryWebhookDelivery(delivery.id);
            toast.success(t('integrations.webhooks_deliveries_retried', 'Delivery queued for retry.'));
            onRetried?.(result.delivery);
        } catch (error) {
            const code = error instanceof ApiError ? apiErrorCode(error) : null;

            if (code === 'webhooks_delivery_not_failed') {
                toast.error(
                    t('integrations.webhooks_deliveries_retry_not_failed', 'Only failed deliveries can be retried.')
                );
            } else if (code === 'webhooks_not_configured') {
                toast.error(t('integrations.webhooks_not_configured', 'Configure webhooks before sending a test.'));
            } else {
                toast.error(t('integrations.webhooks_deliveries_retry_error', 'Unable to retry this delivery.'));
            }
        } finally {
            setRetrying(false);
        }
    }

    const retryable = delivery !== null && isRetryableWebhookDelivery(delivery.status);
    const json = delivery !== null ? payloadJson(delivery.payload) : null;
    const status = delivery !== null ? String(delivery.status) : '';

    return (
        <SideDrawer
            open={open}
            onClose={onClose}
            title={delivery?.event ?? ''}
            titleClassName="truncate font-mono"
            closeLabel={t('common.close')}
            footer={
                open && retryable ? (
                    <div className="flex w-full justify-end">
                        <Button
                            type="button"
                            color="dark/zinc"
                            disabled={retrying}
                            onClick={() => void handleRetry()}
                            data-webhook-delivery-retry="true"
                        >
                            {retrying
                                ? t('integrations.webhooks_deliveries_retrying', 'Retrying…')
                                : t('integrations.webhooks_deliveries_retry', 'Retry')}
                        </Button>
                    </div>
                ) : undefined
            }
        >
            {delivery !== null ? (
                <div className="flex flex-1 flex-col" data-webhook-delivery-drawer="true">
                    <div className="px-5 pt-1 pb-4">
                        <PillNav value={tab} onChange={setTab}>
                            <PillNavItem value="summary">
                                {t('integrations.webhooks_delivery_summary', 'Summary')}
                            </PillNavItem>
                            <PillNavItem value="payload">
                                {t('integrations.webhooks_delivery_payload', 'Payload')}
                            </PillNavItem>
                        </PillNav>
                    </div>

                    {tab === 'summary' ? (
                        <div className="px-5 pb-5" data-webhook-delivery-summary="true">
                            <DescriptionList>
                                <DescriptionTerm>{t('common.type')}</DescriptionTerm>
                                <DescriptionDetails>
                                    <span className="font-mono">{delivery.event}</span>
                                </DescriptionDetails>

                                <DescriptionTerm>{t('integrations.webhooks_status', 'Status')}</DescriptionTerm>
                                <DescriptionDetails>
                                    <Badge color={webhookDeliveryStatusColor(status)}>
                                        {t(webhookDeliveryStatusLabelKey(status), status)}
                                    </Badge>
                                </DescriptionDetails>

                                <DescriptionTerm>
                                    {t('integrations.webhooks_delivery_http_status', 'HTTP status')}
                                </DescriptionTerm>
                                <DescriptionDetails>
                                    {delivery.http_status != null ? (
                                        <span className="font-mono">{delivery.http_status}</span>
                                    ) : (
                                        '—'
                                    )}
                                </DescriptionDetails>

                                <DescriptionTerm>{t('integrations.webhooks_url', 'Endpoint URL')}</DescriptionTerm>
                                <DescriptionDetails>
                                    <span className="inline-flex max-w-full flex-wrap items-center gap-2">
                                        <span className="min-w-0 break-all font-mono">{delivery.url}</span>
                                        <Button
                                            type="button"
                                            plain
                                            aria-label={`${t('integrations.webhooks_copy_id', 'Copy')} ${t('integrations.webhooks_url', 'Endpoint URL')}`}
                                            onClick={() =>
                                                void copyValue(
                                                    delivery.url,
                                                    'integrations.webhooks_delivery_url_copied',
                                                    'URL copied.'
                                                )
                                            }
                                            data-webhook-delivery-copy-url="true"
                                        >
                                            {t('integrations.webhooks_copy_id', 'Copy')}
                                        </Button>
                                    </span>
                                </DescriptionDetails>

                                <DescriptionTerm>
                                    {t('integrations.webhooks_deliveries_id', 'Delivery id')}
                                </DescriptionTerm>
                                <DescriptionDetails>
                                    <span className="inline-flex max-w-full flex-wrap items-center gap-2">
                                        <span className="min-w-0 break-all font-mono">{delivery.id}</span>
                                        <Button
                                            type="button"
                                            plain
                                            aria-label={`${t('integrations.webhooks_copy_id', 'Copy')} ${t('integrations.webhooks_deliveries_id', 'Delivery id')}`}
                                            onClick={() =>
                                                void copyValue(
                                                    delivery.id,
                                                    'integrations.webhooks_delivery_id_copied',
                                                    'Delivery id copied.'
                                                )
                                            }
                                            data-webhook-delivery-copy-id="true"
                                        >
                                            {t('integrations.webhooks_copy_id', 'Copy')}
                                        </Button>
                                    </span>
                                </DescriptionDetails>

                                <DescriptionTerm>
                                    {t('integrations.webhooks_delivery_attempts', 'Attempts')}
                                </DescriptionTerm>
                                <DescriptionDetails>{delivery.attempts}</DescriptionDetails>

                                <DescriptionTerm>{t('integrations.webhooks_logs_sent_at', 'Sent at')}</DescriptionTerm>
                                <DescriptionDetails>{formatTimestamp(delivery.created_at)}</DescriptionDetails>

                                <DescriptionTerm>
                                    {t('integrations.webhooks_deliveries_error', 'Error')}
                                </DescriptionTerm>
                                <DescriptionDetails className="whitespace-pre-wrap break-all">
                                    {delivery.error_message !== null && delivery.error_message !== ''
                                        ? delivery.error_message
                                        : '—'}
                                </DescriptionDetails>

                                <DescriptionTerm>
                                    {t('integrations.webhooks_deliveries_response', 'Response')}
                                </DescriptionTerm>
                                <DescriptionDetails>
                                    {delivery.response_body !== null && delivery.response_body !== '' ? (
                                        <pre className="overflow-x-auto font-mono text-xs/5 whitespace-pre-wrap">
                                            {delivery.response_body}
                                        </pre>
                                    ) : (
                                        '—'
                                    )}
                                </DescriptionDetails>
                            </DescriptionList>
                        </div>
                    ) : (
                        <div className="px-5 pb-5" data-webhook-delivery-payload="true">
                            {json !== null ? (
                                <pre className="overflow-x-auto rounded-lg border border-zinc-950/10 bg-zinc-50 px-3 py-2.5 font-mono text-xs/5 text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                                    {json}
                                </pre>
                            ) : (
                                <p className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                    {t('integrations.webhooks_payload_empty', 'No payload stored for this delivery.')}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ) : null}
        </SideDrawer>
    );
}
