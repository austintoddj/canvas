import { useCallback, useEffect, useState } from 'react';
import { IconRefresh } from '@tabler/icons-react';

import { Button } from '@/components/button';
import { Subheading } from '@/components/heading';
import {
    Pagination,
    PaginationGap,
    PaginationList,
    PaginationNext,
    PaginationPage,
    PaginationPrevious,
} from '@/components/pagination';
import { Select } from '@/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table';
import { TableListSkeleton } from '@/components/TableListSkeleton';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import {
    integrationsApi,
    type WebhookDelivery,
    type WebhookDeliveryStatus,
    type WebhookEventOption,
} from '@/lib/api/integrations';
import { formatListDate } from '@/lib/format-list-date';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { webhookDeliveryStatusDotClasses, webhookDeliveryStatusLabelKey } from '@/lib/integrations/webhook-deliveries';
import { paginationWindow } from '@/lib/list-pagination';
import { cn } from '@/lib/utils';

type StatusFilter = '' | WebhookDeliveryStatus;

type WebhookDeliveriesPanelProps = {
    open?: boolean;
    enabled?: boolean;
    /** Bump after send-test so the list reloads without remounting. */
    refreshKey?: number;
    /** Subscribable events for the event filter (plus webhook.test). */
    eventOptions?: WebhookEventOption[];
    onSelectDelivery?: (delivery: WebhookDelivery) => void;
    /** Hide the in-panel title when the page already provides one. */
    showHeading?: boolean;
};

const STATUS_FILTERS: { value: StatusFilter; labelKey: string; fallback: string }[] = [
    { value: '', labelKey: 'integrations.webhooks_deliveries_filter_all_statuses', fallback: 'All statuses' },
    { value: 'pending', labelKey: 'integrations.webhooks_deliveries_status_pending', fallback: 'Pending' },
    { value: 'success', labelKey: 'integrations.webhooks_deliveries_status_success', fallback: 'Success' },
    { value: 'failed', labelKey: 'integrations.webhooks_deliveries_status_failed', fallback: 'Failed' },
];

const FALLBACK_EVENT_OPTIONS: WebhookEventOption[] = [
    { id: 'post.published', label: 'Published' },
    { id: 'post.scheduled', label: 'Scheduled' },
    { id: 'post.updated', label: 'Updated' },
    { id: 'post.unpublished', label: 'Unpublished' },
    { id: 'post.deleted', label: 'Deleted' },
];

export function WebhookDeliveriesPanel({
    open = true,
    enabled = true,
    refreshKey = 0,
    eventOptions,
    onSelectDelivery,
    showHeading = true,
}: WebhookDeliveriesPanelProps) {
    const { t } = useCanvas();
    const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
    const [eventFilter, setEventFilter] = useState('');

    const filterActive = statusFilter !== '' || eventFilter !== '';

    const eventsForSelect = (() => {
        const base = eventOptions && eventOptions.length > 0 ? eventOptions : FALLBACK_EVENT_OPTIONS;
        const hasTest = base.some((option) => option.id === 'webhook.test');

        if (hasTest) {
            return base;
        }

        return [
            ...base,
            {
                id: 'webhook.test',
                label: t('integrations.webhooks_event_test', 'Test'),
            },
        ];
    })();

    const load = useCallback(
        async (signal?: AbortSignal) => {
            setLoading(true);
            setLoadError(null);

            try {
                const result = await integrationsApi.webhookDeliveries(
                    {
                        page,
                        status: statusFilter === '' ? undefined : statusFilter,
                        event: eventFilter === '' ? undefined : eventFilter,
                    },
                    signal
                );
                setDeliveries(result.data);
                setLastPage(result.last_page);
                setLoading(false);
            } catch {
                if (signal?.aborted) {
                    return;
                }

                setLoadError(t('integrations.webhooks_deliveries_load_error', 'Unable to load delivery history.'));
                setDeliveries([]);
                setLastPage(1);
                setLoading(false);
            }
        },
        [t, page, statusFilter, eventFilter]
    );

    useEffect(() => {
        if (!open || !enabled) {
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
    }, [open, enabled, refreshKey, load]);

    function goToPage(next: number) {
        setPage(next);
    }

    if (!enabled) {
        return null;
    }

    const showInitialSkeleton = loading && deliveries.length === 0 && loadError === null;

    return (
        <div className="min-w-0 space-y-4" data-webhook-deliveries="true">
            <div className={cn('flex min-w-0 items-start gap-3', showHeading ? 'justify-between' : 'justify-end')}>
                {showHeading ? (
                    <div className="min-w-0 space-y-1">
                        <Subheading level={2}>{t('integrations.webhooks_logs', 'Webhook logs')}</Subheading>
                        <p className="text-xs text-canvas-muted dark:text-canvas-muted-dark">
                            {t('integrations.webhooks_logs_retention', 'Retains logs for 30 days.')}
                        </p>
                    </div>
                ) : null}
                <Button
                    type="button"
                    outline
                    disabled={loading}
                    onClick={() => void load()}
                    data-webhook-deliveries-refresh="true"
                >
                    <IconRefresh data-slot="icon" className={cn(loading && 'animate-spin')} aria-hidden="true" />
                    {t('integrations.webhooks_deliveries_refresh', 'Refresh')}
                </Button>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2" data-webhook-deliveries-filters="true">
                <Select
                    name="webhook-delivery-status"
                    className="min-w-0"
                    aria-label={t('integrations.webhooks_deliveries_filter_status', 'Filter by status')}
                    value={statusFilter}
                    onChange={(event) => {
                        setPage(1);
                        setStatusFilter(event.target.value as StatusFilter);
                    }}
                    data-webhook-deliveries-status-filter="true"
                >
                    {STATUS_FILTERS.map((option) => (
                        <option key={option.value || 'all'} value={option.value}>
                            {t(option.labelKey, option.fallback)}
                        </option>
                    ))}
                </Select>

                <Select
                    name="webhook-delivery-event"
                    className="min-w-0"
                    aria-label={t('integrations.webhooks_deliveries_filter_event', 'Filter by event')}
                    value={eventFilter}
                    onChange={(event) => {
                        setPage(1);
                        setEventFilter(event.target.value);
                    }}
                    data-webhook-deliveries-event-filter="true"
                >
                    <option value="">{t('integrations.webhooks_deliveries_filter_all_events', 'All events')}</option>
                    {eventsForSelect.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            </div>

            {loadError ? (
                <p className="text-sm text-red-600 dark:text-red-400" data-webhook-deliveries-error="true">
                    {loadError}
                </p>
            ) : null}

            {showInitialSkeleton ? (
                <div aria-busy="true">
                    <TableListSkeleton rows={4} columns={4} />
                </div>
            ) : (
                <Table data-webhook-deliveries-table="true">
                    <TableHead>
                        <TableRow>
                            <TableHeader>{t('integrations.webhooks_status', 'Status')}</TableHeader>
                            <TableHeader>{t('integrations.webhooks_logs_event', 'Event')}</TableHeader>
                            <TableHeader>{t('integrations.webhooks_url', 'Endpoint URL')}</TableHeader>
                            <TableHeader>{t('integrations.webhooks_logs_sent_at', 'Sent at')}</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!loading && !loadError && deliveries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="whitespace-normal">
                                    <Text
                                        data-webhook-deliveries-empty="true"
                                        data-webhook-deliveries-filtered={filterActive ? 'true' : undefined}
                                    >
                                        {filterActive
                                            ? t(
                                                  'integrations.webhooks_deliveries_filtered_empty',
                                                  'No deliveries match these filters.'
                                              )
                                            : t(
                                                  'integrations.webhooks_deliveries_empty',
                                                  'No deliveries yet. Publish a post or send a test webhook to see history here.'
                                              )}
                                    </Text>
                                </TableCell>
                            </TableRow>
                        ) : null}

                        {deliveries.map((delivery) => {
                            const status = String(delivery.status);
                            const statusLabel = t(webhookDeliveryStatusLabelKey(status), status);
                            const statusDot = webhookDeliveryStatusDotClasses(status);
                            const sentAt = formatListDate(delivery.created_at);
                            const relative = formatRelativeTime(delivery.created_at);

                            return (
                                <TableRow
                                    key={delivery.id}
                                    className="group/list-row cursor-pointer hover:bg-zinc-950/5 dark:hover:bg-white/5"
                                    tabIndex={0}
                                    data-webhook-delivery={delivery.id}
                                    onClick={() => onSelectDelivery?.(delivery)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            onSelectDelivery?.(delivery);
                                        }
                                    }}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
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
                                            <span className="sr-only">{statusLabel}</span>
                                            {delivery.http_status != null ? (
                                                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                                                    {t(
                                                        'integrations.webhooks_deliveries_http',
                                                        { status: String(delivery.http_status) },
                                                        'HTTP :status'
                                                    )}
                                                </span>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[14rem]">
                                        <span className="block truncate font-mono text-sm font-medium text-zinc-950 dark:text-white">
                                            {delivery.event}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-[16rem]">
                                        <span
                                            className="block truncate font-mono text-sm text-canvas-muted dark:text-canvas-muted-dark"
                                            title={delivery.url}
                                        >
                                            {delivery.url}
                                        </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        <span title={relative ?? undefined}>{sentAt}</span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            {lastPage > 1 ? (
                <Pagination className="mt-2" data-webhook-deliveries-pagination="true">
                    <PaginationPrevious onClick={page > 1 ? () => goToPage(page - 1) : undefined} />
                    <PaginationList>
                        {paginationWindow(page, lastPage).map((item, index) =>
                            item === 'gap' ? (
                                <PaginationGap key={`gap-${index}`} />
                            ) : (
                                <PaginationPage key={item} current={item === page} onClick={() => goToPage(item)}>
                                    {item}
                                </PaginationPage>
                            )
                        )}
                    </PaginationList>
                    <PaginationNext onClick={page < lastPage ? () => goToPage(page + 1) : undefined} />
                </Pagination>
            ) : null}
        </div>
    );
}
