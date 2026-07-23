import { translationsApi } from '@/lib/api/translations';
import { applyDocumentLocale } from '@/lib/document-locale';
import { loadTranslations } from '@/lib/i18n';
import type { CanvasBoot, LanguageOption, UserResource } from '@/types/boot';

export function dictionaryToTranslationsJson(dictionary: Record<string, string>): string {
    return JSON.stringify(dictionary);
}

export function withUpdatedLocale(boot: CanvasBoot, locale: string, translationsJson: string): CanvasBoot {
    const user: UserResource = {
        ...boot.user,
        canvas: boot.user.canvas
            ? {
                  ...boot.user.canvas,
                  locale,
              }
            : boot.user.canvas,
    };

    return {
        ...boot,
        translations: translationsJson,
        user,
    };
}

export function withUpdatedUser(boot: CanvasBoot, user: UserResource): CanvasBoot {
    return {
        ...boot,
        user,
    };
}

export function syncWindowCanvas(boot: CanvasBoot): void {
    window.Canvas = boot;
}

export async function fetchLocaleBootUpdate(
    boot: CanvasBoot,
    locale: string,
    signal?: AbortSignal
): Promise<CanvasBoot> {
    const dictionary = await translationsApi.show(locale, signal);
    const translationsJson = dictionaryToTranslationsJson(dictionary);
    const next = withUpdatedLocale(boot, locale, translationsJson);

    loadTranslations(translationsJson);
    applyDocumentLocale(locale, boot.languages as LanguageOption[]);
    syncWindowCanvas(next);

    return next;
}
