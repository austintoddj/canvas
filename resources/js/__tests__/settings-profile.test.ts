import { describe, expect, it } from 'vitest';

import {
    adminUserFromResource,
    emptyProfileForm,
    profileFromUser,
    serializeProfileForm,
    toAdminUserStorePayload,
    toProfileStorePayload,
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
            twitter: 'https://twitter.com/ada',
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
        expect(form.social.twitter).toBe('https://twitter.com/ada');
        expect(profileFromUser({ id: 1, name: 'Host', email: 'h@x.com', avatar_url: '' })).toEqual(emptyProfileForm());

        const payload = toProfileStorePayload(form);
        expect(payload).toMatchObject({
            username: 'ada',
            summary: 'Mathematician',
            website: 'https://ada.dev',
            social: {
                twitter: 'https://twitter.com/ada',
                github: 'https://github.com/ada',
            },
            digest: true,
        });
        expect(payload).not.toHaveProperty('role');

        const blank = emptyProfileForm();
        blank.username = '  ';
        blank.social.twitter = '  ';
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
});
