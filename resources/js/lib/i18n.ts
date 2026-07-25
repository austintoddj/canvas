export type TranslationDictionary = Record<string, string>;

export type TranslationReplacements = Record<string, string | number>;

export type Translator = {
    t: (key: string, replacementsOrFallback?: string | TranslationReplacements, fallback?: string) => string;
    dictionary: TranslationDictionary;
};

let activeTranslator: Translator | null = null;

export function parseTranslations(json: string): TranslationDictionary {
    if (json.trim() === '') {
        return {};
    }

    try {
        const parsed: unknown = JSON.parse(json);

        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            return {};
        }

        return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value)]));
    } catch {
        return {};
    }
}

export function interpolate(template: string, replacements?: TranslationReplacements): string {
    if (replacements === undefined) {
        return template;
    }

    return template.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (match, name: string) => {
        if (Object.prototype.hasOwnProperty.call(replacements, name)) {
            return String(replacements[name]);
        }

        return match;
    });
}

export function createTranslator(dictionary: TranslationDictionary): Translator {
    return {
        dictionary,
        t(key: string, replacementsOrFallback?: string | TranslationReplacements, fallback?: string) {
            const value = dictionary[key];
            let resolved: string;
            let replacements: TranslationReplacements | undefined;

            if (typeof replacementsOrFallback === 'string') {
                resolved = value !== undefined && value !== '' ? value : replacementsOrFallback;
            } else if (replacementsOrFallback !== undefined) {
                replacements = replacementsOrFallback;
                resolved = value !== undefined && value !== '' ? value : (fallback ?? key);
            } else {
                resolved = value !== undefined && value !== '' ? value : (fallback ?? key);
            }

            return interpolate(resolved, replacements);
        },
    };
}

export function loadTranslations(json: string): Translator {
    activeTranslator = createTranslator(parseTranslations(json));

    return activeTranslator;
}

export function getTranslator(): Translator {
    if (activeTranslator === null) {
        const json = typeof window !== 'undefined' ? (window.Canvas?.translations ?? '') : '';
        activeTranslator = loadTranslations(json);
    }

    return activeTranslator;
}

export function t(key: string, replacementsOrFallback?: string | TranslationReplacements, fallback?: string): string {
    return getTranslator().t(key, replacementsOrFallback, fallback);
}
