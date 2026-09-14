import { useCallback, useEffect, useState } from 'react';

import { AiIntegrationDrawer } from '@/components/integrations/AiIntegrationDrawer';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { IntegrationsListSkeleton } from '@/components/integrations/IntegrationsListSkeleton';
import { UnsplashIntegrationDrawer } from '@/components/integrations/UnsplashIntegrationDrawer';
import { WebhookIntegrationDrawer } from '@/components/integrations/WebhookIntegrationDrawer';
import { PageHeader } from '@/components/PageHeader';
import { PageDescription, ErrorText } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { integrationsApi, type IntegrationsStatus } from '@/lib/api/integrations';

type IntegrationDrawer = 'unsplash' | 'ai' | 'webhooks';

export default function IntegrationsIndex() {
    const { t, setIntegrationFlags } = useCanvas();
    const [status, setStatus] = useState<IntegrationsStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [openDrawer, setOpenDrawer] = useState<IntegrationDrawer | null>(null);

    useDocumentTitle(t('integrations.title'));

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

    const closeDrawer = useCallback(() => {
        setOpenDrawer(null);
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

    const unsplashStatus = status?.unsplash.status ?? 'off';
    const aiStatus = status?.ai.status ?? 'off';
    const webhooksStatus = status?.webhooks.status ?? 'off';
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
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    data-integrations-list="true"
                    data-integrations-cards="true"
                >
                    <IntegrationCard
                        kind="unsplash"
                        title={t('integrations.unsplash')}
                        description={t('integrations.unsplash_help')}
                        status={unsplashStatus}
                        configuredLabel={enabledLabel}
                        notConfiguredLabel={notEnabledLabel}
                        actionLabel={configureLabel}
                        selected={openDrawer === 'unsplash'}
                        onClick={() => setOpenDrawer('unsplash')}
                    />
                    <IntegrationCard
                        kind="ai"
                        title={t('integrations.ai')}
                        description={t('integrations.ai_help', 'Rewrite and SEO tools with Grok, ChatGPT, or Claude.')}
                        status={aiStatus}
                        configuredLabel={enabledLabel}
                        notConfiguredLabel={notEnabledLabel}
                        actionLabel={configureLabel}
                        selected={openDrawer === 'ai'}
                        onClick={() => setOpenDrawer('ai')}
                    />
                    <IntegrationCard
                        kind="webhooks"
                        title={t('integrations.webhooks', 'Webhooks')}
                        description={t(
                            'integrations.webhooks_help',
                            'Notify external services when posts are published, scheduled, updated, or deleted.'
                        )}
                        status={webhooksStatus}
                        configuredLabel={enabledLabel}
                        notConfiguredLabel={
                            status?.webhooks.pending === true
                                ? t('integrations.webhooks_status_pending', 'Pending')
                                : notEnabledLabel
                        }
                        actionLabel={configureLabel}
                        selected={openDrawer === 'webhooks'}
                        onClick={() => setOpenDrawer('webhooks')}
                    />
                </div>
            )}

            <UnsplashIntegrationDrawer
                open={openDrawer === 'unsplash'}
                configured={status?.unsplash.configured === true}
                maskedKey={status?.unsplash.masked_key ?? null}
                onClose={closeDrawer}
                onStatusChange={handleStatusChange}
            />

            <AiIntegrationDrawer
                open={openDrawer === 'ai'}
                configured={status?.ai.configured === true}
                provider={status?.ai.provider ?? null}
                model={status?.ai.model ?? null}
                maskedKey={status?.ai.masked_key ?? null}
                onClose={closeDrawer}
                onStatusChange={handleStatusChange}
            />

            <WebhookIntegrationDrawer
                open={openDrawer === 'webhooks'}
                configured={status?.webhooks.configured === true}
                pending={status?.webhooks.pending === true}
                url={status?.webhooks.url ?? null}
                maskedSecret={status?.webhooks.masked_secret ?? null}
                events={status?.webhooks.events ?? []}
                availableEvents={status?.webhooks.available_events ?? []}
                onClose={closeDrawer}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
}
