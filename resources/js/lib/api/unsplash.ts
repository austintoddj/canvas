import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import type { UnsplashErrorResponse, UnsplashParams, UnsplashSearchResponse } from '@/types/api';

export const unsplashApi = {
    search(params: UnsplashParams = {}, signal?: AbortSignal) {
        return api.get<UnsplashSearchResponse | UnsplashErrorResponse>(`/unsplash${buildQueryString(params)}`, signal);
    },
};
