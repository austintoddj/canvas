import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/button';
import { useCanvas } from '@/hooks/useCanvas';
import { integrationsApi, type WebhookDelivery } from '@/lib/api/integrations';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { webhookDeliveryStatusDotClasses, webhookDeliveryStatusLabelKey } from '@/lib/integrations/webhook-deliveries';
import { cn } from '@/lib/utils';

const PREVIEW_LIMIT = 5;

type WebhookLogsPreviewProps = {
    open?: boolean;
    refreshKey?: number;
};

export function WebhookLogsPreview({ open = true, refreshKey = 0 }: WebhookLogsPreviewProps) {
    const { t } = useCanvas();
    const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const load = useCallback(
        async (signal?: AbortSignal) => {
            setLoading(true);
            setLoadError(null);

            try {
                const result = await integrationsApi.webhookDeliveries({ page: 1, per_page: PREVIEW_LIMIT }, signal);
                setDeliveries(result.data.slice(0, PREVIEW_LIMIT));
                setLoading(false);
            } catch {
                if (signal?.aborted) {
                    return;
                }

                setLoadError(t('integrations.webhooks_deliveries_load_error', 'Unable to load delivery history.'));
                setDeliveries([]);
                setLoading(false);
            }
        },
        [t]
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        const controller = new AbortController();
        let cancelled = false;

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
    }, [open, refreshKey, load]);

    const empty = !loading && loadError === null && deliveries.length === 0;

    return (
        <div className="space-y-3" data-webhook-logs-preview="true">
            <p className="text-sm/6 font-medium text-zinc-950 dark:text-white">
                {t('integrations.webhooks_logs', 'Webhook logs')}
            </p>

            <div className="overflow-hidden rounded-xl border border-zinc-950/10 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5">
                <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_auto] gap-3 px-3.5 pt-3 pb-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{t('integrations.webhooks_status', 'Status')}</span>
                    <span>{t('integrations.webhooks_logs_event', 'Event')}</span>
                    <span className="text-right">{t('integrations.webhooks_logs_sent_at', 'Sent at')}</span>
                </div>

                <div className="p-1.5 pt-1">
                    <div className="overflow-hidden rounded-lg bg-zinc-950/[0.03] dark:bg-white/[0.04]">
                        {loading && deliveries.length === 0 ? (
                            <div className="space-y-2 px-3 py-3" aria-busy="true">
                                <div className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-950/10 dark:bg-white/10" />
                                <div className="h-3.5 w-2/3 animate-pulse rounded bg-zinc-950/10 dark:bg-white/10" />
                                <div className="h-3.5 w-1/2 animate-pulse rounded bg-zinc-950/10 dark:bg-white/10" />
                            </div>
                        ) : null}

                        {loadError ? (
                            <p className="px-3 py-3 text-sm text-red-600 dark:text-red-400">{loadError}</p>
                        ) : null}

                        {empty ? (
                            <p
                                className="px-3 py-3 text-sm text-canvas-muted dark:text-canvas-muted-dark"
                                data-webhook-logs-preview-empty="true"
                            >
                                {t(
                                    'integrations.webhooks_deliveries_empty',
                                    'No deliveries yet. Publish a post or send a test webhook to see history here.'
                                )}
                            </p>
                        ) : null}

                        {deliveries.map((delivery, index) => {
                            const status = String(delivery.status);
                            const statusLabel = t(webhookDeliveryStatusLabelKey(status), status);
                            const statusDot = webhookDeliveryStatusDotClasses(status);
                            const sent =
                                formatRelativeTime(delivery.created_at) ?? formatRelativeTime(delivery.finished_at);

                            return (
                                <div
                                    key={delivery.id}
                                    className={cn(
                                        'grid grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_auto] items-center gap-3 px-3 py-2.5 text-sm',
                                        index > 0 && 'border-t border-zinc-950/5 dark:border-white/5'
                                    )}
                                    data-webhook-logs-preview-row={delivery.id}
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span
                                            className="relative inline-flex size-3.5 shrink-0 items-center justify-center"
                                            data-webhook-delivery-status={status}
                                            title={statusLabel}
                                        >
                                            <span
                                                className={cn('absolute inset-0 rounded-full', statusDot.halo)}
                                                aria-hidden="true"
                                            />
                                            <span
                                                className={cn('relative size-1.5 rounded-full', statusDot.core)}
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <span className="truncate text-zinc-950 dark:text-white">{statusLabel}</span>
                                    </span>
                                    <span
                                        className="min-w-0 truncate font-mono text-xs text-zinc-600 dark:text-zinc-300"
                                        title={delivery.event}
                                    >
                                        {delivery.event}
                                    </span>
                                    <span className="shrink-0 text-right text-xs text-zinc-500 dark:text-zinc-400">
                                        {sent ?? '—'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Button href="/integrations/webhooks" outline data-webhook-logs-link="true">
                {t('integrations.webhooks_view_more', 'View more')}
            </Button>
        </div>
    );
}
