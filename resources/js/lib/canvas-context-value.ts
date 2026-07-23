import { createTranslator, parseTranslations, type TranslationReplacements } from '@/lib/i18n';
import {
    canManageIntegrations,
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
    canManageIntegrations: boolean;
    canViewAllPosts: boolean;
    canViewAllMedia: boolean;
};

export type Translate = (
    key: string,
    replacementsOrFallback?: string | TranslationReplacements,
    fallback?: string
) => string;

export type CanvasBootIntegrationFlags = Pick<CanvasBoot, 'ai' | 'unsplash'>;

export type CanvasContextValue = {
    boot: CanvasBoot;
    user: UserResource;
    t: Translate;
    permissions: CanvasPermissions;
    switchLocale: (locale: string, signal?: AbortSignal) => Promise<void>;
    setUser: (user: UserResource) => void;
    setIntegrationFlags: (flags: Partial<CanvasBootIntegrationFlags>) => void;
};

export function buildPermissions(user: UserResource): CanvasPermissions {
    return {
        role: canvasRole(user),
        isContributor: isContributor(user),
        isEditor: isEditor(user),
        isAdmin: isAdmin(user),
        canManageUsers: canManageUsers(user),
        canManageTaxonomy: canManageTaxonomy(user),
        canManageIntegrations: canManageIntegrations(user),
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
        switchLocale: async () => undefined,
        setUser: () => undefined,
        setIntegrationFlags: () => undefined,
    };
}
