import type { TagStorePayload, TopicStorePayload } from '@/types/api';

export type TaxonomyFormState = {
    name: string;
    slug: string;
};

export function emptyTaxonomyForm(): TaxonomyFormState {
    return {
        name: '',
        slug: '',
    };
}

export function taxonomySlugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function taxonomyToFormState(item: { name: string; slug: string }): TaxonomyFormState {
    return {
        name: item.name ?? '',
        slug: item.slug ?? '',
    };
}

export function toTaxonomyStorePayload(form: TaxonomyFormState): TagStorePayload & TopicStorePayload {
    return {
        name: form.name.trim(),
        slug: form.slug.trim(),
    };
}

export function serializeTaxonomyForm(form: TaxonomyFormState): string {
    return JSON.stringify(toTaxonomyStorePayload(form));
}

export function isTaxonomyFormValid(form: TaxonomyFormState): boolean {
    const payload = toTaxonomyStorePayload(form);

    return payload.name !== '' && payload.slug !== '';
}

export function nextSlugFromName(name: string, currentSlug: string, slugManuallyEdited: boolean): string {
    if (slugManuallyEdited) {
        return currentSlug;
    }

    return taxonomySlugify(name);
}

export function isSlugManuallyEdited(name: string, slug: string): boolean {
    if (slug === '') {
        return false;
    }

    return slug !== taxonomySlugify(name);
}
