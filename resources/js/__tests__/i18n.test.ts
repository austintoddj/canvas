import { afterEach, describe, expect, it } from 'vitest';

import { createTranslator, getTranslator, loadTranslations, parseTranslations, t } from '@/lib/i18n';

const sampleDictionary = {
    hello: 'Hello',
    views: 'Views',
};

describe('i18n helpers', () => {
    afterEach(() => {
        loadTranslations('');
    });

    it('parses dictionaries and resolves translations with fallbacks', () => {
        expect(parseTranslations(JSON.stringify(sampleDictionary))).toEqual(sampleDictionary);
        expect(parseTranslations('not-json')).toEqual({});
        expect(parseTranslations('[]')).toEqual({});
        expect(parseTranslations(JSON.stringify({ count: 3 }))).toEqual({ count: '3' });

        const translator = createTranslator(sampleDictionary);
        expect(translator.t('hello')).toBe('Hello');
        expect(translator.t('missing_key')).toBe('missing_key');
        expect(translator.t('missing_key', 'Fallback')).toBe('Fallback');

        loadTranslations(JSON.stringify(sampleDictionary));
        expect(getTranslator().t('hello')).toBe('Hello');
        expect(t('views')).toBe('Views');
    });

    it('interpolates :placeholders in translations', () => {
        loadTranslations(JSON.stringify({ 'common.version': 'Version :version' }));

        expect(t('common.version', { version: '7.0.0' })).toBe('Version 7.0.0');
        expect(t('missing.count', { count: 3 }, ':count items')).toBe('3 items');
    });
});
