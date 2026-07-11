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

describe('taxonomySlugify', () => {
    it('converts text to alpha-dash slugs without inventing a fallback', () => {
        expect(taxonomySlugify('Hello, Canvas!')).toBe('hello-canvas');
        expect(taxonomySlugify('  News & Updates  ')).toBe('news-updates');
        expect(taxonomySlugify('   ')).toBe('');
    });
});

describe('taxonomyToFormState / toTaxonomyStorePayload', () => {
    it('maps API fields into form state and back for store', () => {
        const form = taxonomyToFormState({ name: ' Design ', slug: 'design' });

        expect(form).toEqual({ name: ' Design ', slug: 'design' });
        expect(toTaxonomyStorePayload(form)).toEqual({ name: 'Design', slug: 'design' });
    });

    it('serializes form state stably for dirty checks', () => {
        const form = emptyTaxonomyForm();
        form.name = 'Guides';
        form.slug = 'guides';

        expect(serializeTaxonomyForm(form)).toBe(JSON.stringify({ name: 'Guides', slug: 'guides' }));
    });
});

describe('nextSlugFromName', () => {
    it('auto-fills slug until manually edited', () => {
        expect(nextSlugFromName('Hello World', '', false)).toBe('hello-world');
        expect(nextSlugFromName('Hello World', 'custom', true)).toBe('custom');
    });
});

describe('isSlugManuallyEdited', () => {
    it('detects when slug diverges from the name', () => {
        expect(isSlugManuallyEdited('Hello', 'hello')).toBe(false);
        expect(isSlugManuallyEdited('Hello', 'custom')).toBe(true);
        expect(isSlugManuallyEdited('Hello', '')).toBe(false);
    });
});

describe('isTaxonomyFormValid', () => {
    it('requires non-empty name and slug', () => {
        expect(isTaxonomyFormValid({ name: '', slug: 'x' })).toBe(false);
        expect(isTaxonomyFormValid({ name: 'x', slug: '' })).toBe(false);
        expect(isTaxonomyFormValid({ name: 'x', slug: 'x' })).toBe(true);
    });
});
