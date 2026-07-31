import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import type { Paginated } from '@/types/api';

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
    description?: string;
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

export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed';

export type WebhookDelivery = {
    id: string;
    event: string;
    url: string;
    status: WebhookDeliveryStatus | string;
    http_status: number | null;
    attempts: number;
    payload: Record<string, unknown> | null;
    response_body: string | null;
    error_message: string | null;
    post_id: string | null;
    finished_at: string | null;
    created_at: string | null;
    updated_at: string | null;
};

export type WebhookDeliveriesIndexParams = {
    page?: number;
    status?: WebhookDeliveryStatus | string;
    event?: string;
};

export type WebhookDeliveryRetryResponse = {
    ok: boolean;
    delivery: WebhookDelivery;
    original_delivery_id: string;
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

    webhookDeliveries(params: WebhookDeliveriesIndexParams = {}, signal?: AbortSignal) {
        return api.get<Paginated<WebhookDelivery>>(
            `/integrations/webhooks/deliveries${buildQueryString(params)}`,
            signal
        );
    },

    webhookDelivery(id: string, signal?: AbortSignal) {
        return api.get<WebhookDelivery>(`/integrations/webhooks/deliveries/${id}`, signal);
    },

    retryWebhookDelivery(id: string, signal?: AbortSignal) {
        return api.post<WebhookDeliveryRetryResponse>(
            `/integrations/webhooks/deliveries/${id}/retry`,
            undefined,
            signal
        );
    },
};
