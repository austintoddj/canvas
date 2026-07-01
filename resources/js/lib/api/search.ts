import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import type { SearchParams, SearchResult } from '@/types/api';

export const searchApi = {
    index(params: SearchParams = {}, signal?: AbortSignal) {
        return api.get<SearchResult[]>(`/search${buildQueryString(params)}`, signal);
    },
};
