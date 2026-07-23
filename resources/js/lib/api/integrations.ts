import { api } from '@/lib/api';

export type UnsplashIntegrationStatus = {
    configured: boolean;
    masked_key: string | null;
    enabled_at: string | null;
};

export type AiProviderValue = 'xai' | 'openai' | 'anthropic';

export type AiIntegrationStatus = {
    configured: boolean;
    provider: AiProviderValue | null;
    masked_key: string | null;
    model: string | null;
    enabled_at: string | null;
};

export type IntegrationsStatus = {
    unsplash: UnsplashIntegrationStatus;
    ai: AiIntegrationStatus;
};

export type UpdateIntegrationsPayload = {
    unsplash?: {
        access_key: string | null;
    };
    ai?: {
        provider?: AiProviderValue | null;
        api_key?: string | null;
        model?: string | null;
    };
};

export const integrationsApi = {
    show(signal?: AbortSignal) {
        return api.get<IntegrationsStatus>('/integrations', signal);
    },

    update(payload: UpdateIntegrationsPayload, signal?: AbortSignal) {
        return api.put<IntegrationsStatus>('/integrations', payload, signal);
    },
};
