import { api } from '@/lib/api';

export type TranslationsDictionary = Record<string, string>;

export const translationsApi = {
    show(locale: string, signal?: AbortSignal): Promise<TranslationsDictionary> {
        return api.get<TranslationsDictionary>(`/translations/${encodeURIComponent(locale)}`, signal);
    },
};
