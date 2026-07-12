import { api } from '@/lib/api';

export type UnsplashIntegrationStatus = {
    configured: boolean;
    masked_key: string | null;
};

export type IntegrationsStatus = {
    unsplash: UnsplashIntegrationStatus;
};

export type UpdateIntegrationsPayload = {
    unsplash: {
        access_key: string | null;
    };
};

export const integrationsApi = {
    show(signal?: AbortSignal) {
        return api.get<IntegrationsStatus>('/settings/integrations', signal);
    },

    update(payload: UpdateIntegrationsPayload, signal?: AbortSignal) {
        return api.put<IntegrationsStatus>('/settings/integrations', payload, signal);
    },
};
