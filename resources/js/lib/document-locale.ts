import type { LanguageOption } from '@/types/boot';

export function applyDocumentLocale(locale: string, languages: LanguageOption[]): void {
    const option = languages.find((language) => language.code === locale);
    const html = document.documentElement;

    html.lang = locale.replace('_', '-');
    html.dir = option?.rtl ? 'rtl' : 'ltr';
}

export function localeFromBoot(): string {
    return window.Canvas?.user?.canvas?.locale ?? window.Canvas?.defaultLocale ?? 'en';
}
