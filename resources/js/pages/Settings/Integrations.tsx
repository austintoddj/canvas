import { useEffect, useState } from 'react';

import { AiIntegrationDrawer } from '@/components/integrations/AiIntegrationDrawer';
import { IntegrationRow } from '@/components/integrations/IntegrationRow';
import { IntegrationsListSkeleton } from '@/components/integrations/IntegrationsListSkeleton';
import { UnsplashIntegrationDrawer } from '@/components/integrations/UnsplashIntegrationDrawer';
import { PageHeader } from '@/components/PageHeader';
import { PageDescription, ErrorText } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { integrationsApi, type IntegrationsStatus } from '@/lib/api/integrations';

type OpenDrawer = 'unsplash' | 'ai' | null;

export default function SettingsIntegrations() {
    const { t, setIntegrationFlags } = useCanvas();
    const [status, setStatus] = useState<IntegrationsStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [openDrawer, setOpenDrawer] = useState<OpenDrawer>(null);

    useDocumentTitle(t('integrations.title'));

    function handleStatusChange(next: IntegrationsStatus) {
        setStatus(next);
        setIntegrationFlags({
            ai: next.ai.configured === true,
            unsplash: next.unsplash.configured === true,
        });
    }

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
    const configureLabel = t('integrations.configure', 'Configure');
    const enabledLabel = t('integrations.enabled', 'Enabled');
    const notEnabledLabel = t('integrations.not_enabled', 'Not enabled');

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <PageHeader title={t('integrations.title')}>
                <PageDescription>{t('integrations.description')}</PageDescription>
            </PageHeader>

            {loadError ? <ErrorText>{loadError}</ErrorText> : null}

            {loading ? (
                <div aria-busy="true">
                    <IntegrationsListSkeleton rows={2} />
                </div>
            ) : (
                <div
                    className="divide-y divide-zinc-950/5 overflow-hidden rounded-xl border border-zinc-950/10 dark:divide-white/5 dark:border-white/10"
                    data-integrations-list="true"
                >
                    <IntegrationRow
                        kind="unsplash"
                        title={t('integrations.unsplash')}
                        description={t('integrations.unsplash_help')}
                        configured={unsplashConfigured}
                        configuredLabel={enabledLabel}
                        notConfiguredLabel={notEnabledLabel}
                        actionLabel={configureLabel}
                        onConfigure={() => setOpenDrawer('unsplash')}
                    />
                    <IntegrationRow
                        kind="ai"
                        title={t('integrations.ai')}
                        description={t('integrations.ai_help', 'Rewrite and SEO tools with Grok, ChatGPT, or Claude.')}
                        configured={aiConfigured}
                        configuredLabel={enabledLabel}
                        notConfiguredLabel={notEnabledLabel}
                        actionLabel={configureLabel}
                        onConfigure={() => setOpenDrawer('ai')}
                    />
                </div>
            )}

            <UnsplashIntegrationDrawer
                open={openDrawer === 'unsplash'}
                configured={unsplashConfigured}
                maskedKey={status?.unsplash.masked_key ?? null}
                enabledAt={status?.unsplash.enabled_at ?? null}
                onClose={() => setOpenDrawer(null)}
                onStatusChange={handleStatusChange}
            />

            <AiIntegrationDrawer
                open={openDrawer === 'ai'}
                configured={aiConfigured}
                provider={status?.ai.provider ?? null}
                model={status?.ai.model ?? null}
                maskedKey={status?.ai.masked_key ?? null}
                enabledAt={status?.ai.enabled_at ?? null}
                onClose={() => setOpenDrawer(null)}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
}
