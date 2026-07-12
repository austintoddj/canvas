import { describe, expect, it } from 'vitest';

import {
    emptyTaxonomyForm,
    isSlugManuallyEdited,
    isTaxonomyFormValid,
    nextSlugFromName,
    serializeTaxonomyForm,
    taxonomySlugify,
    taxonomyToFormState,
    toTaxonomyStorePayload,
} from '@/lib/taxonomy/form';

describe('taxonomy form helpers', () => {
    it('slugifies, maps payloads, and tracks manual slug edits', () => {
        expect(taxonomySlugify('Hello, Canvas!')).toBe('hello-canvas');
        expect(taxonomySlugify('   ')).toBe('');

        const form = taxonomyToFormState({ name: ' Design ', slug: 'design' });
        expect(toTaxonomyStorePayload(form)).toEqual({ name: 'Design', slug: 'design' });

        const dirty = emptyTaxonomyForm();
        dirty.name = 'Guides';
        dirty.slug = 'guides';
        expect(serializeTaxonomyForm(dirty)).toBe(JSON.stringify({ name: 'Guides', slug: 'guides' }));

        expect(nextSlugFromName('Hello World', '', false)).toBe('hello-world');
        expect(nextSlugFromName('Hello World', 'custom', true)).toBe('custom');
        expect(isSlugManuallyEdited('Hello', 'hello')).toBe(false);
        expect(isSlugManuallyEdited('Hello', 'custom')).toBe(true);
        expect(isTaxonomyFormValid({ name: '', slug: 'x' })).toBe(false);
        expect(isTaxonomyFormValid({ name: 'x', slug: 'x' })).toBe(true);
    });
});
