import type { UnsplashPhoto } from '@/types/api';

export type UnsplashCreditTranslate = (
    key: string,
    replacements?: Record<string, string | number>,
    fallback?: string
) => string;

export function unsplashPhotographerName(photo: Pick<UnsplashPhoto, 'user'>): string {
    return photo.user.name.trim();
}

export function formatUnsplashCredit(photo: Pick<UnsplashPhoto, 'user'>, t: UnsplashCreditTranslate): string {
    const name = unsplashPhotographerName(photo);
    const resolvedName = name === '' ? 'Unsplash' : name;

    return t('unsplash.photo_by_on', { name: resolvedName }, `Photo by ${resolvedName} on Unsplash`);
}

export function formatUnsplashAlt(
    photo: Pick<UnsplashPhoto, 'user' | 'alt_description' | 'description'>,
    t: UnsplashCreditTranslate
): string {
    const description = photo.alt_description?.trim() || photo.description?.trim() || '';

    if (description !== '') {
        return description;
    }

    return formatUnsplashCredit(photo, t);
}

export function buildUnsplashBodyInsertHtml(options: { src: string; alt: string; credit: string }): string {
    const src = escapeHtmlAttribute(options.src);
    const alt = escapeHtmlAttribute(options.alt);
    const credit = escapeHtmlText(options.credit);

    return `<img src="${src}" alt="${alt}" class="canvas-post-body-image" /><p class="canvas-post-body-image-credit" data-canvas-image-credit="true">${credit}</p>`;
}

function escapeHtmlAttribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtmlText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
