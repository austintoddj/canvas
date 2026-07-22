// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    dictionaryToTranslationsJson,
    fetchLocaleBootUpdate,
    withUpdatedLocale,
    withUpdatedUser,
} from '@/lib/locale-switch';
import { getTranslator, loadTranslations } from '@/lib/i18n';
import type { CanvasBoot } from '@/types/boot';

function bootFixture(): CanvasBoot {
    return {
        path: '/canvas',
        languages: [
            { code: 'en', label: 'English', rtl: false },
            { code: 'de', label: 'German', rtl: false },
            { code: 'ar-EG', label: 'Arabic (Egypt)', rtl: true },
        ],
        defaultLocale: 'en',
        maxUpload: 3_145_728,
        roles: { 1: 'Contributor', 2: 'Editor', 3: 'Admin' },
        appTimezone: 'UTC',
        translations: JSON.stringify({ 'nav.dashboard': 'Dashboard', 'nav.posts': 'Posts' }),
        unsplash: false,
        ai: false,
        assetsUpToDate: true,
        version: '7.0.0',
        user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: 'https://example.com/avatar.jpg',
            canvas: {
                role: 3,
                username: null,
                summary: null,
                avatar: null,
                avatar_url: 'https://example.com/avatar.jpg',
                website: null,
                social: {},
                locale: 'en',
                timezone: 'UTC',
                theme: 'system',
                digest: false,
                preferences: { onboarding: { complete: true } },
            },
        },
    };
}

describe('locale switch helpers', () => {
    afterEach(() => {
        loadTranslations('');
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
        vi.unstubAllGlobals();
    });

    it('updates boot translations and user locale', () => {
        const next = withUpdatedLocale(bootFixture(), 'de', JSON.stringify({ 'nav.dashboard': 'Dashboard-de' }));

        expect(next.user.canvas?.locale).toBe('de');
        expect(next.translations).toContain('Dashboard-de');
    });

    it('updates boot user without changing translations', () => {
        const boot = bootFixture();
        const nextUser = {
            ...boot.user,
            name: 'Renamed',
        };

        expect(withUpdatedUser(boot, nextUser).user.name).toBe('Renamed');
        expect(withUpdatedUser(boot, nextUser).translations).toBe(boot.translations);
    });

    it('fetches translations, applies dictionary, and sets document direction', async () => {
        const fetchMock = vi.fn(async () => ({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: async () => ({
                'nav.dashboard': 'لوحة القيادة',
                'nav.posts': 'المشاركات',
            }),
        }));

        vi.stubGlobal('fetch', fetchMock);
        window.Canvas = bootFixture();

        const next = await fetchLocaleBootUpdate(bootFixture(), 'ar-EG');

        expect(fetchMock).toHaveBeenCalled();
        expect(next.user.canvas?.locale).toBe('ar-EG');
        expect(getTranslator().t('nav.dashboard')).toBe('لوحة القيادة');
        expect(document.documentElement.lang).toBe('ar-EG');
        expect(document.documentElement.dir).toBe('rtl');
        expect(JSON.parse(dictionaryToTranslationsJson({ a: '1' }))).toEqual({ a: '1' });
    });
});
