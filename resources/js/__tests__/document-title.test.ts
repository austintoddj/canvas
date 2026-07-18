import { describe, expect, it } from 'vitest';

import { DOCUMENT_TITLE_PRODUCT, formatDocumentTitle } from '@/lib/document-title';

describe('formatDocumentTitle', () => {
    it('returns the product name when the page segment is empty', () => {
        expect(formatDocumentTitle()).toBe(DOCUMENT_TITLE_PRODUCT);
        expect(formatDocumentTitle(null)).toBe(DOCUMENT_TITLE_PRODUCT);
        expect(formatDocumentTitle('')).toBe(DOCUMENT_TITLE_PRODUCT);
        expect(formatDocumentTitle('   ')).toBe(DOCUMENT_TITLE_PRODUCT);
    });

    it('joins a page segment with the product using an em dash', () => {
        expect(formatDocumentTitle('Posts')).toBe('Posts ― Canvas');
        expect(formatDocumentTitle('  Dashboard  ')).toBe('Dashboard ― Canvas');
    });

    it('supports a custom product label', () => {
        expect(formatDocumentTitle('Media', 'Canvas CMS')).toBe('Media ― Canvas CMS');
    });
});
