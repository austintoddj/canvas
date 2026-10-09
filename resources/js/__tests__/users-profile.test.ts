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
} from '@/lib/users/profile';
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
        preferences: {},
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
        expect(normalizeSocialHandle('linkedin', 'https://www.linkedin.com/in/ada-lovelace/')).toBe('ada-lovelace');
        expect(normalizeSocialHandle('youtube', 'https://www.youtube.com/@canvas/videos')).toBe('canvas');
        expect(normalizeSocialHandle('tiktok', 'https://www.tiktok.com/@ada/video/123')).toBe('ada');
        expect(normalizeSocialHandle('instagram', '  handle  ')).toBe('handle');
        expect(socialProfileUrl('x', '@ada')).toBe('https://x.com/ada');
        expect(socialProfileUrl('medium', 'writer')).toBe('https://medium.com/@writer');
        expect(socialProfileUrl('linkedin', 'ada-lovelace')).toBe('https://www.linkedin.com/in/ada-lovelace');
        expect(socialProfileUrl('youtube', '@canvas')).toBe('https://www.youtube.com/@canvas');
        expect(socialProfileUrl('tiktok', 'ada')).toBe('https://www.tiktok.com/@ada');
        expect(socialProfileUrl('github', '')).toBeNull();
    });

    it('keeps type prefixes for linkedin and youtube pages', () => {
        expect(normalizeSocialHandle('linkedin', 'https://www.linkedin.com/company/acme/')).toBe('company/acme');
        expect(normalizeSocialHandle('linkedin', 'linkedin.com/school/mit/about')).toBe('school/mit');
        expect(normalizeSocialHandle('linkedin', 'https://www.linkedin.com/showcase/acme-labs')).toBe(
            'showcase/acme-labs'
        );
        expect(normalizeSocialHandle('linkedin', 'company/acme')).toBe('company/acme');
        expect(normalizeSocialHandle('youtube', 'https://www.youtube.com/channel/UC123abc/videos')).toBe(
            'channel/UC123abc'
        );
        expect(normalizeSocialHandle('youtube', 'https://www.youtube.com/c/canvas')).toBe('c/canvas');
        expect(normalizeSocialHandle('youtube', 'https://m.youtube.com/user/canvas')).toBe('user/canvas');

        expect(socialProfileUrl('linkedin', 'https://www.linkedin.com/company/acme')).toBe(
            'https://www.linkedin.com/company/acme'
        );
        expect(socialProfileUrl('linkedin', 'school/mit')).toBe('https://www.linkedin.com/school/mit');
        expect(socialProfileUrl('linkedin', 'company')).toBe('https://www.linkedin.com/in/company');
        expect(socialProfileUrl('youtube', 'channel/UC123abc')).toBe('https://www.youtube.com/channel/UC123abc');
        expect(socialProfileUrl('youtube', 'https://www.youtube.com/c/canvas')).toBe(
            'https://www.youtube.com/c/canvas'
        );
        expect(socialProfileUrl('youtube', 'user/canvas')).toBe('https://www.youtube.com/user/canvas');
        expect(socialProfileUrl('github', 'company/acme')).toBe('https://github.com/company/acme');
    });

    it('strips full URLs when serializing social payload', () => {
        const form = emptyProfileForm();
        form.social.x = 'https://x.com/ada';
        form.social.github = 'github.com/canvas';
        form.social.medium = 'https://medium.com/@ada';
        form.social.linkedin = 'linkedin.com/in/ada';

        expect(toProfileStorePayload(form).social).toEqual({
            x: 'ada',
            github: 'canvas',
            medium: 'ada',
            linkedin: 'ada',
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
