// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';

import { applyDocumentLocale } from '@/lib/document-locale';

describe('document locale', () => {
    afterEach(() => {
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
    });

    it('sets lang and dir from the language catalog', () => {
        applyDocumentLocale('ar-EG', [
            { code: 'en', label: 'English', rtl: false },
            { code: 'ar-EG', label: 'Arabic (Egypt)', rtl: true },
        ]);

        expect(document.documentElement.lang).toBe('ar-EG');
        expect(document.documentElement.dir).toBe('rtl');
    });

    it('defaults to ltr for unknown languages', () => {
        applyDocumentLocale('de', [{ code: 'en', label: 'English', rtl: false }]);

        expect(document.documentElement.lang).toBe('de');
        expect(document.documentElement.dir).toBe('ltr');
    });
});
