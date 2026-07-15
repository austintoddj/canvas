import { api } from '@/lib/api';

export type AiRewriteAction = 'improve' | 'fix_grammar' | 'shorten' | 'expand' | 'custom';

export type AiRewritePayload = {
    action: AiRewriteAction;
    text: string;
    instruction?: string | null;
    title?: string | null;
};

export type AiRewriteResponse = {
    text: string;
};

export const aiApi = {
    rewrite(payload: AiRewritePayload, signal?: AbortSignal) {
        return api.post<AiRewriteResponse>('/ai/rewrite', payload, signal);
    },
};
