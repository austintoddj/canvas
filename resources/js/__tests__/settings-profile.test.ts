import { describe, expect, it } from 'vitest';

import {
    adminUserFromResource,
    emptyProfileForm,
    normalizeSocialHandle,
    profileFromUser,
    serializeProfileForm,
    socialProfileUrl,
    toAdminUserStorePayload,
    toProfileStorePayload,
    withSerializedProfileLocale,
} from '@/lib/settings/profile';
import type { UserResource } from '@/types/boot';

const sampleUser: UserResource = {
    id: 9,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    avatar_url: 'https://example.com/ada.png',
    posts_count: 4,
    canvas: {
        role: 2,
        username: 'ada',
        summary: 'Mathematician',
        avatar: 'https://cdn.example.com/ada.jpg',
        avatar_url: 'https://cdn.example.com/ada.jpg',
        website: 'https://ada.dev',
        social: {
            x: 'https://x.com/ada',
            github: 'https://github.com/ada',
        },
        locale: 'en',
        timezone: 'Europe/London',
        theme: 'dark',
        digest: true,
        preferences: { onboarding: { complete: true } },
    },
};

describe('settings profile helpers', () => {
    it('hydrates profile forms and serializes store payloads', () => {
        const form = profileFromUser(sampleUser);
        expect(form).toMatchObject({
            username: 'ada',
            summary: 'Mathematician',
            website: 'https://ada.dev',
            locale: 'en',
            timezone: 'Europe/London',
            digest: true,
        });
        expect(form.social.x).toBe('ada');
        expect(form.social.github).toBe('ada');
        expect(profileFromUser({ id: 1, name: 'Host', email: 'h@x.com', avatar_url: '' })).toEqual(emptyProfileForm());

        const payload = toProfileStorePayload(form);
        expect(payload).toMatchObject({
            username: 'ada',
            summary: 'Mathematician',
            website: 'https://ada.dev',
            social: {
                x: 'ada',
                github: 'ada',
            },
            digest: true,
        });
        expect(payload).not.toHaveProperty('role');

        const blank = emptyProfileForm();
        blank.username = '  ';
        blank.social.x = '  ';
        expect(toProfileStorePayload(blank)).toMatchObject({
            username: null,
            social: {},
            digest: false,
        });
        expect(serializeProfileForm(form)).toBe(JSON.stringify(toProfileStorePayload(form)));

        const admin = adminUserFromResource(sampleUser);
        expect(admin).toEqual({ role: 2 });
        expect(toAdminUserStorePayload(admin)).toEqual({ role: 2 });
        expect(toAdminUserStorePayload(admin)).not.toHaveProperty('summary');
        expect(toAdminUserStorePayload(admin)).not.toHaveProperty('username');
    });

    it('normalizes social handles from URLs and bare values', () => {
        expect(normalizeSocialHandle('x', 'https://x.com/ada')).toBe('ada');
        expect(normalizeSocialHandle('x', 'https://twitter.com/ada')).toBe('ada');
        expect(normalizeSocialHandle('x', '@ada')).toBe('ada');
        expect(normalizeSocialHandle('github', 'https://github.com/canvas/')).toBe('canvas');
        expect(normalizeSocialHandle('medium', 'https://medium.com/@writer')).toBe('writer');
        expect(normalizeSocialHandle('medium', '@writer')).toBe('writer');
        expect(normalizeSocialHandle('bluesky', 'https://bsky.app/profile/ada.bsky.social')).toBe('ada.bsky.social');
        expect(normalizeSocialHandle('instagram', '  handle  ')).toBe('handle');
        expect(socialProfileUrl('x', '@ada')).toBe('https://x.com/ada');
        expect(socialProfileUrl('medium', 'writer')).toBe('https://medium.com/@writer');
        expect(socialProfileUrl('github', '')).toBeNull();
    });

    it('strips full URLs when serializing social payload', () => {
        const form = emptyProfileForm();
        form.social.x = 'https://x.com/ada';
        form.social.github = 'github.com/canvas';
        form.social.medium = 'https://medium.com/@ada';

        expect(toProfileStorePayload(form).social).toEqual({
            x: 'ada',
            github: 'canvas',
            medium: 'ada',
        });
    });

    it('updates only locale inside a serialized profile baseline', () => {
        const form = profileFromUser(sampleUser);
        const serialized = serializeProfileForm(form);
        const next = withSerializedProfileLocale(serialized, 'es');

        expect(JSON.parse(next)).toMatchObject({
            username: 'ada',
            locale: 'es',
            timezone: 'Europe/London',
        });
        expect(withSerializedProfileLocale('not-json', 'es')).toBe('not-json');
        expect(withSerializedProfileLocale('[]', 'es')).toBe('[]');
    });
});
