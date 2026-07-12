import { describe, expect, it } from 'vitest';

import {
    Role,
    canManageSettings,
    canManageTaxonomy,
    canManageUsers,
    canViewAllMedia,
    canViewAllPosts,
    canvasRole,
    hasCanvasAccess,
    isAdmin,
    isContributor,
    isEditor,
} from '@/lib/permissions';
import type { UserResource } from '@/types/boot';

function userWithRole(role: number | null): UserResource {
    return {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        canvas:
            role === null
                ? undefined
                : {
                      role,
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
    };
}

describe('permissions', () => {
    it('reads role access and policy helpers', () => {
        expect(canvasRole(userWithRole(Role.Editor))).toBe(Role.Editor);
        expect(canvasRole(userWithRole(null))).toBeNull();
        expect(hasCanvasAccess(userWithRole(Role.Contributor))).toBe(true);
        expect(hasCanvasAccess(userWithRole(null))).toBe(false);

        expect(isContributor(userWithRole(Role.Contributor))).toBe(true);
        expect(isEditor(userWithRole(Role.Editor))).toBe(true);
        expect(isAdmin(userWithRole(Role.Admin))).toBe(true);
        expect(isAdmin(userWithRole(Role.Editor))).toBe(false);

        expect(canManageUsers(userWithRole(Role.Admin))).toBe(true);
        expect(canManageUsers(userWithRole(Role.Editor))).toBe(false);
        expect(canManageTaxonomy(userWithRole(Role.Admin))).toBe(true);
        expect(canManageTaxonomy(userWithRole(Role.Contributor))).toBe(false);
        expect(canManageSettings(userWithRole(Role.Admin))).toBe(true);
        expect(canManageSettings(userWithRole(Role.Editor))).toBe(false);

        expect(canViewAllPosts(userWithRole(Role.Editor))).toBe(true);
        expect(canViewAllPosts(userWithRole(Role.Admin))).toBe(true);
        expect(canViewAllPosts(userWithRole(Role.Contributor))).toBe(false);
        expect(canViewAllPosts(userWithRole(null))).toBe(false);
        expect(canViewAllMedia(userWithRole(Role.Editor))).toBe(canViewAllPosts(userWithRole(Role.Editor)));
    });
});
