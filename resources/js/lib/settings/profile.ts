import { Role, type RoleValue } from '@/lib/permissions';
import type { UserStorePayload } from '@/types/api';
import type { CanvasProfile, UserResource } from '@/types/boot';

export type SocialFieldKey = 'facebook' | 'instagram' | 'bluesky' | 'x' | 'github' | 'medium';

export const SOCIAL_FIELD_KEYS: SocialFieldKey[] = ['facebook', 'instagram', 'bluesky', 'x', 'github', 'medium'];

export const SOCIAL_LABELS: Record<SocialFieldKey, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    bluesky: 'Bluesky',
    x: 'X',
    github: 'GitHub',
    medium: 'Medium',
};

/** Public profile URL prefix per platform (handle is appended). */
export const SOCIAL_PROFILE_BASES: Record<SocialFieldKey, string> = {
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    bluesky: 'https://bsky.app/profile/',
    x: 'https://x.com/',
    github: 'https://github.com/',
    medium: 'https://medium.com/@',
};

export const SOCIAL_PLACEHOLDERS: Record<SocialFieldKey, string> = {
    facebook: 'username',
    instagram: 'username',
    bluesky: 'handle.bsky.social',
    x: 'username',
    github: 'username',
    medium: 'username',
};

const SOCIAL_HOST_ALIASES: Record<SocialFieldKey, string[]> = {
    facebook: ['facebook.com', 'www.facebook.com', 'fb.com', 'www.fb.com', 'm.facebook.com'],
    instagram: ['instagram.com', 'www.instagram.com'],
    bluesky: ['bsky.app', 'www.bsky.app'],
    x: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'],
    github: ['github.com', 'www.github.com'],
    medium: ['medium.com', 'www.medium.com'],
};

export type ProfileFormState = {
    username: string;
    summary: string;
    avatar: string;
    website: string;
    social: Record<SocialFieldKey, string>;
    locale: string;
    timezone: string;
    digest: boolean;
};

export function emptySocial(): Record<SocialFieldKey, string> {
    return {
        facebook: '',
        instagram: '',
        bluesky: '',
        x: '',
        github: '',
        medium: '',
    };
}

export function emptyProfileForm(defaults?: { locale?: string; timezone?: string }): ProfileFormState {
    return {
        username: '',
        summary: '',
        avatar: '',
        website: '',
        social: emptySocial(),
        locale: defaults?.locale ?? 'en',
        timezone: defaults?.timezone ?? 'UTC',
        digest: false,
    };
}

/**
 * Reduce a stored value or pasted URL to a bare handle for the given platform.
 */
export function normalizeSocialHandle(platform: SocialFieldKey, raw: string): string {
    let value = raw.trim();

    if (value === '') {
        return '';
    }

    if (!/^https?:\/\//i.test(value) && value.includes('.') && value.includes('/')) {
        value = `https://${value.replace(/^\/+/, '')}`;
    }

    if (/^https?:\/\//i.test(value)) {
        try {
            const url = new URL(value);
            const host = url.hostname.toLowerCase();
            const aliases = SOCIAL_HOST_ALIASES[platform];

            if (aliases.includes(host)) {
                const segments = url.pathname
                    .split('/')
                    .map((segment) => segment.trim())
                    .filter((segment) => segment !== '');

                if (platform === 'bluesky' && segments[0]?.toLowerCase() === 'profile') {
                    segments.shift();
                }

                if (platform === 'medium' && segments[0]?.startsWith('@')) {
                    segments[0] = segments[0].slice(1);
                }

                if (segments[0] !== undefined && segments[0] !== '') {
                    value = segments[0];
                }
            }
        } catch {
            // Keep original string when URL parsing fails.
        }
    }

    value = value
        .replace(/^@+/, '')
        .replace(/^\/+|\/+$/g, '')
        .trim();

    if (platform === 'medium') {
        value = value.replace(/^@+/, '');
    }

    return value;
}

export function socialProfileUrl(platform: SocialFieldKey, handle: string): string | null {
    const normalized = normalizeSocialHandle(platform, handle);

    if (normalized === '') {
        return null;
    }

    return `${SOCIAL_PROFILE_BASES[platform]}${normalized}`;
}

function socialFromProfile(social: Record<string, string> | undefined): Record<SocialFieldKey, string> {
    const next = emptySocial();

    if (social === undefined) {
        return next;
    }

    for (const key of SOCIAL_FIELD_KEYS) {
        const value = social[key];
        next[key] = typeof value === 'string' ? normalizeSocialHandle(key, value) : '';
    }

    return next;
}

export function profileFromUser(
    user: UserResource,
    defaults?: { locale?: string; timezone?: string }
): ProfileFormState {
    const canvas: CanvasProfile | undefined = user.canvas;

    if (canvas === undefined) {
        return emptyProfileForm(defaults);
    }

    return {
        username: canvas.username ?? '',
        summary: canvas.summary ?? '',
        avatar: canvas.avatar ?? '',
        website: canvas.website ?? '',
        social: socialFromProfile(canvas.social),
        locale: canvas.locale || defaults?.locale || 'en',
        timezone: canvas.timezone || defaults?.timezone || 'UTC',
        digest: Boolean(canvas.digest),
    };
}

export function toProfileStorePayload(form: ProfileFormState): UserStorePayload {
    const social: Record<string, string> = {};

    for (const key of SOCIAL_FIELD_KEYS) {
        const value = normalizeSocialHandle(key, form.social[key]);

        if (value !== '') {
            social[key] = value;
        }
    }

    return {
        username: form.username.trim() === '' ? null : form.username.trim(),
        summary: form.summary.trim() === '' ? null : form.summary.trim(),
        avatar: form.avatar.trim() === '' ? null : form.avatar.trim(),
        website: form.website.trim() === '' ? null : form.website.trim(),
        social,
        locale: form.locale || null,
        timezone: form.timezone || null,
        digest: form.digest,
    };
}

export function serializeProfileForm(form: ProfileFormState): string {
    return JSON.stringify(toProfileStorePayload(form));
}

/** Update only `locale` in a serialized profile payload (instant language switch baseline). */
export function withSerializedProfileLocale(serialized: string, locale: string): string {
    try {
        const data: unknown = JSON.parse(serialized);

        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            return serialized;
        }

        return JSON.stringify({ ...data, locale });
    } catch {
        return serialized;
    }
}

export type AdminUserFormState = {
    role: RoleValue | null;
};

export function adminUserFromResource(user: UserResource): AdminUserFormState {
    const role = user.canvas?.role;

    return {
        role: role === Role.Contributor || role === Role.Editor || role === Role.Admin ? role : null,
    };
}

export function toAdminUserStorePayload(form: AdminUserFormState): UserStorePayload {
    return {
        role: form.role,
    };
}

export function serializeAdminUserForm(form: AdminUserFormState): string {
    return JSON.stringify(toAdminUserStorePayload(form));
}
