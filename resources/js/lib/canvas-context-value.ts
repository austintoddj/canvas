import { createTranslator, parseTranslations } from '@/lib/i18n';
import {
    canManageSettings,
    canManageTaxonomy,
    canManageUsers,
    canViewAllMedia,
    canViewAllPosts,
    canvasRole,
    isAdmin,
    isContributor,
    isEditor,
} from '@/lib/permissions';
import type { CanvasBoot, UserResource } from '@/types/boot';

export type CanvasPermissions = {
    role: number | null;
    isContributor: boolean;
    isEditor: boolean;
    isAdmin: boolean;
    canManageUsers: boolean;
    canManageTaxonomy: boolean;
    canManageSettings: boolean;
    canViewAllPosts: boolean;
    canViewAllMedia: boolean;
};

export type CanvasContextValue = {
    boot: CanvasBoot;
    user: UserResource;
    t: (key: string, fallback?: string) => string;
    permissions: CanvasPermissions;
};

export function buildPermissions(user: UserResource): CanvasPermissions {
    return {
        role: canvasRole(user),
        isContributor: isContributor(user),
        isEditor: isEditor(user),
        isAdmin: isAdmin(user),
        canManageUsers: canManageUsers(user),
        canManageTaxonomy: canManageTaxonomy(user),
        canManageSettings: canManageSettings(user),
        canViewAllPosts: canViewAllPosts(user),
        canViewAllMedia: canViewAllMedia(user),
    };
}

/** Build context value without touching the global translator (for tests). */
export function buildCanvasContextValue(boot: CanvasBoot): CanvasContextValue {
    const translator = createTranslator(parseTranslations(boot.translations));

    return {
        boot,
        user: boot.user,
        t: translator.t,
        permissions: buildPermissions(boot.user),
    };
}
