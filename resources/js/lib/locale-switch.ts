import { translationsApi } from '@/lib/api/translations';
import { applyDocumentLocale } from '@/lib/document-locale';
import { loadTranslations } from '@/lib/i18n';
import { Role } from '@/lib/permissions';
import type { CanvasBoot, LanguageOption, UserResource } from '@/types/boot';

export function dictionaryToTranslationsJson(dictionary: Record<string, string>): string {
    return JSON.stringify(dictionary);
}

function parseDictionary(translationsJson: string): Record<string, string> {
    try {
        const parsed: unknown = JSON.parse(translationsJson);

        if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, string>;
        }
    } catch {
        // Fall through to empty dictionary.
    }

    return {};
}

const ROLE_LABEL_KEYS: Record<number, string> = {
    [Role.Contributor]: 'users.role_contributor',
    [Role.Editor]: 'users.role_editor',
    [Role.Admin]: 'users.role_admin',
};

/** Remap boot language labels + role labels from a freshly loaded dictionary. */
export function withDictionaryLabels(
    boot: CanvasBoot,
    dictionary: Record<string, string>
): Pick<CanvasBoot, 'languages' | 'roles'> {
    const languages: LanguageOption[] = boot.languages.map((language) => {
        const key = `locale.${language.code}`;
        const label = dictionary[key];

        return {
            ...language,
            label: typeof label === 'string' && label !== '' ? label : language.label,
        };
    });

    const roles: Record<number, string> = { ...boot.roles };

    for (const [value, key] of Object.entries(ROLE_LABEL_KEYS)) {
        const roleValue = Number(value);
        const label = dictionary[key];

        if (typeof label === 'string' && label !== '') {
            roles[roleValue] = label;
        }
    }

    return { languages, roles };
}

export function withUpdatedLocale(boot: CanvasBoot, locale: string, translationsJson: string): CanvasBoot {
    const dictionary = parseDictionary(translationsJson);
    const { languages, roles } = withDictionaryLabels(boot, dictionary);

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
        languages,
        roles,
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
    applyDocumentLocale(locale, next.languages as LanguageOption[]);
    syncWindowCanvas(next);

    return next;
}
