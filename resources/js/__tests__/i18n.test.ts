import { afterEach, describe, expect, it } from 'vitest';

import { createTranslator, getTranslator, loadTranslations, parseTranslations, t } from '@/lib/i18n';

const sampleDictionary = {
    hello: 'Hello',
    views: 'Views',
};

describe('parseTranslations', () => {
    it('parses a JSON object of strings', () => {
        expect(parseTranslations(JSON.stringify(sampleDictionary))).toEqual(sampleDictionary);
    });

    it('returns an empty object for invalid JSON', () => {
        expect(parseTranslations('not-json')).toEqual({});
    });

    it('returns an empty object for non-object payloads', () => {
        expect(parseTranslations('[]')).toEqual({});
        expect(parseTranslations('""')).toEqual({});
    });

    it('coerces values to strings', () => {
        expect(parseTranslations(JSON.stringify({ count: 3 }))).toEqual({ count: '3' });
    });
});

describe('createTranslator', () => {
    it('returns translated values by key', () => {
        const translator = createTranslator(sampleDictionary);

        expect(translator.t('hello')).toBe('Hello');
        expect(translator.t('views')).toBe('Views');
    });

    it('falls back to the key when a translation is missing', () => {
        const translator = createTranslator(sampleDictionary);

        expect(translator.t('missing_key')).toBe('missing_key');
    });

    it('uses an explicit fallback before the key', () => {
        const translator = createTranslator(sampleDictionary);

        expect(translator.t('missing_key', 'Fallback')).toBe('Fallback');
    });
});

describe('loadTranslations and getTranslator', () => {
    afterEach(() => {
        loadTranslations('');
    });

    it('loads boot translations into the active translator', () => {
        loadTranslations(JSON.stringify(sampleDictionary));

        expect(getTranslator().t('hello')).toBe('Hello');
    });

    it('exposes t() from the active translator', () => {
        loadTranslations(JSON.stringify(sampleDictionary));

        expect(t('views')).toBe('Views');
    });
});
