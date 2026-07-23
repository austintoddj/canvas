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

export type WebhookEventId = 'post.published' | 'post.scheduled' | 'post.updated' | 'post.unpublished' | 'post.deleted';

export type WebhookEventOption = {
    id: WebhookEventId | string;
    label: string;
};

export type WebhooksIntegrationStatus = {
    configured: boolean;
    url: string | null;
    masked_secret: string | null;
    events: string[];
    enabled_at: string | null;
    available_events: WebhookEventOption[];
    /** Present only immediately after create/rotate. */
    plain_secret?: string | null;
};

export type IntegrationsStatus = {
    unsplash: UnsplashIntegrationStatus;
    ai: AiIntegrationStatus;
    webhooks: WebhooksIntegrationStatus;
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
    webhooks?: {
        url?: string | null;
        events?: string[];
        rotate_secret?: boolean;
    };
};

export type WebhookTestResponse = {
    ok: boolean;
    delivery_id: string;
    event: string;
};

export const integrationsApi = {
    show(signal?: AbortSignal) {
        return api.get<IntegrationsStatus>('/integrations', signal);
    },

    update(payload: UpdateIntegrationsPayload, signal?: AbortSignal) {
        return api.put<IntegrationsStatus>('/integrations', payload, signal);
    },

    testWebhook(signal?: AbortSignal) {
        return api.post<WebhookTestResponse>('/integrations/webhooks/test', undefined, signal);
    },
};
