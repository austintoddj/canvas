export const DOCUMENT_TITLE_PRODUCT = 'Canvas';
export const DOCUMENT_TITLE_SEPARATOR = '―';

export function formatDocumentTitle(page?: string | null, product: string = DOCUMENT_TITLE_PRODUCT): string {
    const segment = page?.trim() ?? '';

    if (segment === '') {
        return product;
    }

    return `${segment} ${DOCUMENT_TITLE_SEPARATOR} ${product}`;
}
