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

describe('profileFromUser', () => {
    it('hydrates canvas fields into form state', () => {
        const form = profileFromUser(sampleUser);

        expect(form.username).toBe('ada');
        expect(form.summary).toBe('Mathematician');
        expect(form.avatar).toBe('https://cdn.example.com/ada.jpg');
        expect(form.website).toBe('https://ada.dev');
        expect(form.social.twitter).toBe('https://twitter.com/ada');
        expect(form.social.github).toBe('https://github.com/ada');
        expect(form.social.facebook).toBe('');
        expect(form.locale).toBe('en');
        expect(form.timezone).toBe('Europe/London');
        expect(form.digest).toBe(true);
    });

    it('returns empty form when canvas is missing', () => {
        expect(profileFromUser({ id: 1, name: 'Host', email: 'h@x.com', avatar_url: '' })).toEqual(emptyProfileForm());
    });
});

describe('toProfileStorePayload', () => {
    it('serializes form state for POST /users/{id}', () => {
        const form = profileFromUser(sampleUser);
        const payload = toProfileStorePayload(form);

        expect(payload).toEqual({
            username: 'ada',
            summary: 'Mathematician',
            avatar: 'https://cdn.example.com/ada.jpg',
            website: 'https://ada.dev',
            social: {
                twitter: 'https://twitter.com/ada',
                github: 'https://github.com/ada',
            },
            locale: 'en',
            timezone: 'Europe/London',
            digest: true,
        });
        expect(payload).not.toHaveProperty('role');
        expect(payload).not.toHaveProperty('name');
        expect(payload).not.toHaveProperty('email');
    });

    it('nulls blank string fields and drops empty social keys', () => {
        const form = emptyProfileForm();
        form.username = '  ';
        form.social.twitter = '  ';

        expect(toProfileStorePayload(form)).toMatchObject({
            username: null,
            summary: null,
            avatar: null,
            website: null,
            social: {},
            digest: false,
        });
    });

    it('serializes stably for dirty checks', () => {
        const form = profileFromUser(sampleUser);
        expect(serializeProfileForm(form)).toBe(JSON.stringify(toProfileStorePayload(form)));
    });
});

describe('adminUserFromResource / toAdminUserStorePayload', () => {
    it('includes role for admin user edits', () => {
        const form = adminUserFromResource(sampleUser);

        expect(form.role).toBe(2);
        expect(toAdminUserStorePayload(form).role).toBe(2);
        expect(toAdminUserStorePayload(form).username).toBe('ada');
    });
});
