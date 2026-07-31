import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Subheading } from '@/components/heading';
import { useCanvas } from '@/hooks/useCanvas';
import { ApiError, apiErrorCode } from '@/lib/api';
import { integrationsApi, type WebhookDelivery } from '@/lib/api/integrations';
import { formatRelativeTime } from '@/lib/format-relative-time';
import {
    isRetryableWebhookDelivery,
    webhookDeliveryStatusColor,
    webhookDeliveryStatusLabelKey,
} from '@/lib/integrations/webhook-deliveries';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { IconChevronDown, IconRefresh } from '@tabler/icons-react';

type WebhookDeliveriesPanelProps = {
    open: boolean;
    enabled: boolean;
    /** Bump after send-test so the list reloads without closing the drawer. */
    refreshKey?: number;
};

export function WebhookDeliveriesPanel({ open, enabled, refreshKey = 0 }: WebhookDeliveriesPanelProps) {
    const { t } = useCanvas();
    const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [retryingId, setRetryingId] = useState<string | null>(null);

    const load = useCallback(
        async (signal?: AbortSignal) => {
            setLoading(true);
            setLoadError(null);

            try {
                const page = await integrationsApi.webhookDeliveries({ page: 1 }, signal);
                setDeliveries(page.data);
                setLoading(false);
            } catch {
                if (signal?.aborted) {
                    return;
                }

                setLoadError(
                    t('integrations.webhooks_deliveries_load_error', 'Unable to load delivery history.')
                );
                setDeliveries([]);
                setLoading(false);
            }
        },
        [t]
    );

    useEffect(() => {
        if (!open || !enabled) {
            return;
        }

        const controller = new AbortController();
        let cancelled = false;

        // Defer so the open transition does not cascade setState in the same tick.
        queueMicrotask(() => {
            if (cancelled) {
                return;
            }

            void load(controller.signal);
        });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [open, enabled, refreshKey, load]);

    async function handleRetry(delivery: WebhookDelivery) {
        if (retryingId !== null || !isRetryableWebhookDelivery(delivery.status)) {
            return;
        }

        setRetryingId(delivery.id);

        try {
            const result = await integrationsApi.retryWebhookDelivery(delivery.id);
            toast.success(t('integrations.webhooks_deliveries_retried', 'Delivery queued for retry.'));
            setDeliveries((current) => [result.delivery, ...current.filter((row) => row.id !== result.delivery.id)]);
            setExpandedId(result.delivery.id);
        } catch (error) {
            if (error instanceof ApiError) {
                const code = apiErrorCode(error);

                if (code === 'webhooks_not_configured') {
                    toast.error(
                        t('integrations.webhooks_not_configured', 'Configure webhooks before sending a test.')
                    );
                } else if (code === 'webhooks_delivery_not_failed') {
                    toast.error(
                        t(
                            'integrations.webhooks_deliveries_retry_not_failed',
                            'Only failed deliveries can be retried.'
                        )
                    );
                } else {
                    toast.error(
                        t('integrations.webhooks_deliveries_retry_error', 'Unable to retry this delivery.')
                    );
                }
            } else {
                toast.error(t('integrations.webhooks_deliveries_retry_error', 'Unable to retry this delivery.'));
            }
        } finally {
            setRetryingId(null);
        }
    }

    if (!enabled) {
        return null;
    }

    return (
        <section className="min-w-0 space-y-3" data-webhook-deliveries="true">
            <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <Subheading level={3}>
                        {t('integrations.webhooks_deliveries', 'Recent deliveries')}
                    </Subheading>
                    <p className="text-xs text-canvas-muted dark:text-canvas-muted-dark">
                        {t(
                            'integrations.webhooks_deliveries_help',
                            'Outbound attempts from the last 30 days. Failed rows can be retried with a new delivery id.'
                        )}
                    </p>
                </div>
                <Button
                    type="button"
                    outline
                    disabled={loading || retryingId !== null}
                    onClick={() => void load()}
                    data-webhook-deliveries-refresh="true"
                >
                    <IconRefresh className={cn('size-4', loading && 'animate-spin')} aria-hidden="true" />
                    <span className="sr-only">
                        {t('integrations.webhooks_deliveries_refresh', 'Refresh')}
                    </span>
                </Button>
            </div>

            {loadError ? (
                <p className="text-sm text-red-600 dark:text-red-400" data-webhook-deliveries-error="true">
                    {loadError}
                </p>
            ) : null}

            {loading && deliveries.length === 0 ? (
                <p className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                    {t('common.loading', 'Loading…')}
                </p>
            ) : null}

            {!loading && !loadError && deliveries.length === 0 ? (
                <p
                    className="rounded-lg border border-dashed border-zinc-950/10 px-3 py-4 text-sm text-canvas-muted dark:border-white/10 dark:text-canvas-muted-dark"
                    data-webhook-deliveries-empty="true"
                >
                    {t(
                        'integrations.webhooks_deliveries_empty',
                        'No deliveries yet. Publish a post or send a test webhook to see history here.'
                    )}
                </p>
            ) : null}

            {deliveries.length > 0 ? (
                <ul className="divide-y divide-zinc-950/5 overflow-hidden rounded-xl border border-zinc-950/10 dark:divide-white/5 dark:border-white/10">
                    {deliveries.map((delivery) => {
                        const expanded = expandedId === delivery.id;
                        const status = String(delivery.status);
                        const color = webhookDeliveryStatusColor(status);
                        const statusLabel = t(webhookDeliveryStatusLabelKey(status), status);
                        const when = formatRelativeTime(delivery.created_at);
                        const canRetry = isRetryableWebhookDelivery(status);

                        return (
                            <li key={delivery.id} className="min-w-0" data-webhook-delivery={delivery.id}>
                                <div className="flex min-w-0 items-start gap-2 px-3 py-2.5">
                                    <button
                                        type="button"
                                        className="min-w-0 flex-1 text-left"
                                        onClick={() => setExpandedId(expanded ? null : delivery.id)}
                                        aria-expanded={expanded}
                                        data-webhook-delivery-toggle="true"
                                    >
                                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                            <Badge color={color}>{statusLabel}</Badge>
                                            <span className="truncate text-sm font-medium text-zinc-950 dark:text-white">
                                                {delivery.event}
                                            </span>
                                            {delivery.http_status != null ? (
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    {t(
                                                        'integrations.webhooks_deliveries_http',
                                                        { status: String(delivery.http_status) },
                                                        'HTTP :status'
                                                    )}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                            {when ? <span>{when}</span> : null}
                                            <span>
                                                {t(
                                                    'integrations.webhooks_deliveries_attempts',
                                                    { count: delivery.attempts },
                                                    'Attempts: :count'
                                                )}
                                            </span>
                                        </div>
                                        {delivery.error_message && !expanded ? (
                                            <p className="mt-1 line-clamp-1 text-xs text-red-600 dark:text-red-400">
                                                {delivery.error_message}
                                            </p>
                                        ) : null}
                                    </button>
                                    <div className="flex shrink-0 items-center gap-1">
                                        {canRetry ? (
                                            <Button
                                                type="button"
                                                outline
                                                disabled={retryingId !== null}
                                                onClick={() => void handleRetry(delivery)}
                                                data-webhook-delivery-retry="true"
                                            >
                                                {retryingId === delivery.id
                                                    ? t(
                                                          'integrations.webhooks_deliveries_retrying',
                                                          'Retrying…'
                                                      )
                                                    : t('integrations.webhooks_deliveries_retry', 'Retry')}
                                            </Button>
                                        ) : null}
                                        <IconChevronDown
                                            className={cn(
                                                'size-4 shrink-0 text-zinc-400 transition-transform',
                                                expanded && 'rotate-180'
                                            )}
                                            aria-hidden="true"
                                        />
                                    </div>
                                </div>
                                {expanded ? (
                                    <div
                                        className="space-y-2 border-t border-zinc-950/5 bg-zinc-50/60 px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.03]"
                                        data-webhook-delivery-detail="true"
                                    >
                                        <DetailRow
                                            label={t('integrations.webhooks_deliveries_id', 'Delivery id')}
                                            value={delivery.id}
                                            mono
                                        />
                                        <DetailRow
                                            label={t('integrations.webhooks_url', 'Endpoint URL')}
                                            value={delivery.url}
                                            mono
                                        />
                                        {delivery.error_message ? (
                                            <DetailRow
                                                label={t(
                                                    'integrations.webhooks_deliveries_error',
                                                    'Error'
                                                )}
                                                value={delivery.error_message}
                                            />
                                        ) : null}
                                        {delivery.response_body ? (
                                            <DetailRow
                                                label={t(
                                                    'integrations.webhooks_deliveries_response',
                                                    'Response'
                                                )}
                                                value={delivery.response_body}
                                                mono
                                                pre
                                            />
                                        ) : null}
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </section>
    );
}

function DetailRow({
    label,
    value,
    mono = false,
    pre = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
    pre?: boolean;
}) {
    return (
        <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
            {pre ? (
                <pre
                    className={cn(
                        'max-h-32 overflow-auto rounded-md border border-zinc-950/10 bg-white px-2 py-1.5 text-xs text-zinc-800 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200',
                        mono && 'font-mono'
                    )}
                >
                    {value}
                </pre>
            ) : (
                <p
                    className={cn(
                        'break-all text-xs text-zinc-800 dark:text-zinc-200',
                        mono && 'font-mono'
                    )}
                >
                    {value}
                </p>
            )}
        </div>
    );
}
