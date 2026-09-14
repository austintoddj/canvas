import { useCallback, useEffect, useState } from 'react';

import { IntegrationPageShell } from '@/components/integrations/IntegrationPageLayout';
import { WebhookDeliveriesPanel } from '@/components/integrations/WebhookDeliveriesPanel';
import { WebhookDeliveryDrawer } from '@/components/integrations/WebhookDeliveryDrawer';
import { PageHeader } from '@/components/PageHeader';
import { TableListSkeleton } from '@/components/TableListSkeleton';
import { ErrorText, PageDescription } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { integrationsApi, type IntegrationsStatus, type WebhookDelivery } from '@/lib/api/integrations';

export default function WebhooksLogsPage() {
    const { t } = useCanvas();
    const [status, setStatus] = useState<IntegrationsStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [deliveriesRefreshKey, setDeliveriesRefreshKey] = useState(0);
    const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);

    useDocumentTitle(t('integrations.webhooks_logs', 'Webhook logs'));

    const closeDeliveryDrawer = useCallback(() => {
        setSelectedDelivery(null);
    }, []);

    const handleDeliveryRetried = useCallback((next: WebhookDelivery) => {
        setDeliveriesRefreshKey((key) => key + 1);
        setSelectedDelivery(next);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setLoading(true);
            setLoadError(null);

            try {
                const next = await integrationsApi.show(controller.signal);
                setStatus(next);
                setLoading(false);
            } catch {
                if (!controller.signal.aborted) {
                    setLoadError(t('integrations.load_error', 'Unable to load integrations.'));
                    setLoading(false);
                }
            }
        }

        void load();

        return () => controller.abort();
    }, [t]);

    if (loading) {
        return (
            <IntegrationPageShell>
                <div aria-busy="true">
                    <TableListSkeleton rows={4} columns={4} />
                </div>
            </IntegrationPageShell>
        );
    }

    if (loadError) {
        return (
            <IntegrationPageShell>
                <ErrorText>{loadError}</ErrorText>
            </IntegrationPageShell>
        );
    }

    return (
        <IntegrationPageShell>
            <PageHeader title={t('integrations.webhooks_logs', 'Webhook logs')}>
                <PageDescription>
                    {t('integrations.webhooks_logs_retention', 'Retains logs for 30 days.')}
                </PageDescription>
            </PageHeader>

            <div id="webhook-logs">
                <WebhookDeliveriesPanel
                    open
                    enabled
                    showHeading={false}
                    refreshKey={deliveriesRefreshKey}
                    eventOptions={status?.webhooks.available_events ?? []}
                    onSelectDelivery={setSelectedDelivery}
                />
            </div>

            <WebhookDeliveryDrawer
                open={selectedDelivery !== null}
                delivery={selectedDelivery}
                onClose={closeDeliveryDrawer}
                onRetried={handleDeliveryRetried}
            />
        </IntegrationPageShell>
    );
}
