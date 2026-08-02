import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FormPanelSkeleton } from '@/components/FormPanelSkeleton';
import { AiIntegrationDrawer } from '@/components/integrations/AiIntegrationDrawer';
import { IntegrationPageShell } from '@/components/integrations/IntegrationPageLayout';
import { ErrorText } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { integrationsApi, type IntegrationsStatus } from '@/lib/api/integrations';

export default function AiIntegrationPage() {
    const { t, setIntegrationFlags } = useCanvas();
    const navigate = useNavigate();
    const [status, setStatus] = useState<IntegrationsStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useDocumentTitle(t('integrations.ai'));

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
        <AiIntegrationDrawer
            configured={status.ai.configured === true}
            provider={status.ai.provider ?? null}
            model={status.ai.model ?? null}
            maskedKey={status.ai.masked_key ?? null}
            enabledAt={status.ai.enabled_at ?? null}
            onClose={goBack}
            onStatusChange={handleStatusChange}
        />
    );
}
