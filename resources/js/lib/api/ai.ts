import { api } from '@/lib/api';

export type AiRewriteAction = 'improve' | 'fix_grammar' | 'shorten' | 'expand' | 'custom' | 'suggest_seo';

export type AiRewritePayload = {
    action: AiRewriteAction;
    text: string;
    instruction?: string | null;
    title?: string | null;
};

export type AiRewriteResponse = {
    text: string;
};

export type AiSuggestSeoResponse = {
    title: string;
    description: string;
};

export const aiApi = {
    rewrite(payload: AiRewritePayload, signal?: AbortSignal) {
        return api.post<AiRewriteResponse>('/ai/rewrite', payload, signal);
    },

    suggestSeo(payload: Omit<AiRewritePayload, 'action' | 'instruction'>, signal?: AbortSignal) {
        return api.post<AiSuggestSeoResponse>('/ai/rewrite', { ...payload, action: 'suggest_seo' }, signal);
    },
};
