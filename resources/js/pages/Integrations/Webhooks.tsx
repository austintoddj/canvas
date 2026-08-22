import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FormPanelSkeleton } from '@/components/FormPanelSkeleton';
import { IntegrationPageShell } from '@/components/integrations/IntegrationPageLayout';
import { WebhookIntegrationDrawer } from '@/components/integrations/WebhookIntegrationDrawer';
import { ErrorText } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { integrationsApi, type IntegrationsStatus } from '@/lib/api/integrations';

export default function WebhooksIntegrationPage() {
    const { t, setIntegrationFlags } = useCanvas();
    const navigate = useNavigate();
    const [status, setStatus] = useState<IntegrationsStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useDocumentTitle(t('integrations.webhooks', 'Webhooks'));

    const handleStatusChange = useCallback(
        (next: IntegrationsStatus) => {
            setStatus(next);
            setIntegrationFlags({
                ai: next.ai.configured === true,
                unsplash: next.unsplash.configured === true,
            });
        },
        [setIntegrationFlags]
    );

    const goBack = useCallback(() => {
        void navigate('/integrations');
    }, [navigate]);

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
                    <FormPanelSkeleton fields={4} />
                </div>
            </IntegrationPageShell>
        );
    }

    if (loadError || status === null) {
        return (
            <IntegrationPageShell>
                <ErrorText>{loadError ?? t('integrations.load_error', 'Unable to load integrations.')}</ErrorText>
            </IntegrationPageShell>
        );
    }

    return (
        <WebhookIntegrationDrawer
            configured={status.webhooks.configured === true}
            pending={status.webhooks.pending === true}
            url={status.webhooks.url ?? null}
            maskedSecret={status.webhooks.masked_secret ?? null}
            events={status.webhooks.events ?? []}
            availableEvents={status.webhooks.available_events ?? []}
            enabledAt={status.webhooks.enabled_at ?? null}
            onClose={goBack}
            onStatusChange={handleStatusChange}
        />
    );
}
