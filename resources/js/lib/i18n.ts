export type TranslationDictionary = Record<string, string>;

export type Translator = {
    t: (key: string, fallback?: string) => string;
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

export function createTranslator(dictionary: TranslationDictionary): Translator {
    return {
        dictionary,
        t(key: string, fallback?: string) {
            const value = dictionary[key];

            if (value !== undefined && value !== '') {
                return value;
            }

            return fallback ?? key;
        },
    };
}

export function loadTranslations(json: string): Translator {
    activeTranslator = createTranslator(parseTranslations(json));

    return activeTranslator;
}

export function getTranslator(): Translator {
    if (activeTranslator === null) {
        activeTranslator = loadTranslations(window.Canvas?.translations ?? '');
    }

    return activeTranslator;
}

export function t(key: string, fallback?: string): string {
    return getTranslator().t(key, fallback);
}
