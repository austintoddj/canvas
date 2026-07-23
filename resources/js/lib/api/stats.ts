import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import type { DashboardInsights, StatsIndexParams } from '@/types/api';

export const statsApi = {
    index(params: StatsIndexParams = {}, signal?: AbortSignal) {
        return api.get<DashboardInsights>(`/stats${buildQueryString(params)}`, signal);
    },
};
