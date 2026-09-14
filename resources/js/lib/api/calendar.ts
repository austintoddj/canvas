import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/api/query';
import type { CalendarPostsParams, CalendarPostsResponse } from '@/types/api';

export const calendarApi = {
    posts(params: CalendarPostsParams, signal?: AbortSignal) {
        return api.get<CalendarPostsResponse>(`/calendar/posts${buildQueryString(params)}`, signal);
    },
};
