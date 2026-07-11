import type { UserStorePayload } from '@/types/api';
import type { CanvasProfile, UserResource } from '@/types/boot';

export type SocialFieldKey = 'twitter' | 'github' | 'facebook' | 'instagram' | 'linkedin';

export const SOCIAL_FIELD_KEYS: SocialFieldKey[] = ['twitter', 'github', 'facebook', 'instagram', 'linkedin'];

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
        twitter: '',
        github: '',
        facebook: '',
        instagram: '',
        linkedin: '',
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

function socialFromProfile(social: Record<string, string> | undefined): Record<SocialFieldKey, string> {
    const next = emptySocial();

    if (social === undefined) {
        return next;
    }

    for (const key of SOCIAL_FIELD_KEYS) {
        const value = social[key];
        next[key] = typeof value === 'string' ? value : '';
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
        const value = form.social[key].trim();

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

export type AdminUserFormState = ProfileFormState & {
    role: number | null;
};

export function adminUserFromResource(
    user: UserResource,
    defaults?: { locale?: string; timezone?: string }
): AdminUserFormState {
    return {
        ...profileFromUser(user, defaults),
        role: user.canvas?.role ?? null,
    };
}

export function toAdminUserStorePayload(form: AdminUserFormState): UserStorePayload {
    return {
        ...toProfileStorePayload(form),
        role: form.role,
    };
}

export function serializeAdminUserForm(form: AdminUserFormState): string {
    return JSON.stringify(toAdminUserStorePayload(form));
}
