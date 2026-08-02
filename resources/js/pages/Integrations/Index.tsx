import { useEffect, useState } from 'react';

import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { IntegrationsListSkeleton } from '@/components/integrations/IntegrationsListSkeleton';
import { PageHeader } from '@/components/PageHeader';
import { PageDescription, ErrorText } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { integrationsApi, type IntegrationsStatus } from '@/lib/api/integrations';

export default function IntegrationsIndex() {
    const { t } = useCanvas();
    const [status, setStatus] = useState<IntegrationsStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useDocumentTitle(t('integrations.title'));

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

    const unsplashConfigured = status?.unsplash.configured === true;
    const aiConfigured = status?.ai.configured === true;
    const webhooksConfigured = status?.webhooks.configured === true;
    const configureLabel = t('integrations.configure', 'Configure');
    const enabledLabel = t('integrations.enabled', 'Enabled');
    const notEnabledLabel = t('integrations.not_enabled', 'Not enabled');

    return (
        <div className="space-y-8">
            <PageHeader title={t('integrations.title')}>
                <PageDescription>{t('integrations.description')}</PageDescription>
            </PageHeader>

            {loadError ? <ErrorText>{loadError}</ErrorText> : null}

            {loading ? (
                <div aria-busy="true">
                    <IntegrationsListSkeleton rows={3} />
                </div>
            ) : (
                <div
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    data-integrations-list="true"
                    data-integrations-cards="true"
                >
                    <IntegrationCard
                        kind="unsplash"
                        title={t('integrations.unsplash')}
                        description={t('integrations.unsplash_help')}
                        configured={unsplashConfigured}
                        configuredLabel={enabledLabel}
                        notConfiguredLabel={notEnabledLabel}
                        actionLabel={configureLabel}
                        configureHref="/integrations/unsplash"
                    />
                    <IntegrationCard
                        kind="ai"
                        title={t('integrations.ai')}
                        description={t('integrations.ai_help', 'Rewrite and SEO tools with Grok, ChatGPT, or Claude.')}
                        configured={aiConfigured}
                        configuredLabel={enabledLabel}
                        notConfiguredLabel={notEnabledLabel}
                        actionLabel={configureLabel}
                        configureHref="/integrations/ai"
                    />
                    <IntegrationCard
                        kind="webhooks"
                        title={t('integrations.webhooks', 'Webhooks')}
                        description={t(
                            'integrations.webhooks_help',
                            'Notify external services when posts are published, scheduled, updated, or deleted.'
                        )}
                        configured={webhooksConfigured}
                        configuredLabel={enabledLabel}
                        notConfiguredLabel={notEnabledLabel}
                        actionLabel={configureLabel}
                        configureHref="/integrations/webhooks"
                    />
                </div>
            )}
        </div>
    );
}
