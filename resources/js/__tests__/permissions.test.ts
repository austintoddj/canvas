import { describe, expect, it } from 'vitest';

import {
    Role,
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

describe('canvasRole', () => {
    it('returns the nested canvas role', () => {
        expect(canvasRole(userWithRole(Role.Editor))).toBe(Role.Editor);
    });

    it('returns null when canvas is missing', () => {
        expect(canvasRole(userWithRole(null))).toBeNull();
    });
});

describe('hasCanvasAccess', () => {
    it('is true when a role is present', () => {
        expect(hasCanvasAccess(userWithRole(Role.Contributor))).toBe(true);
    });

    it('is false when canvas is missing', () => {
        expect(hasCanvasAccess(userWithRole(null))).toBe(false);
    });
});

describe('role helpers', () => {
    it('identifies contributor, editor, and admin', () => {
        expect(isContributor(userWithRole(Role.Contributor))).toBe(true);
        expect(isEditor(userWithRole(Role.Editor))).toBe(true);
        expect(isAdmin(userWithRole(Role.Admin))).toBe(true);
    });

    it('does not misclassify roles', () => {
        expect(isAdmin(userWithRole(Role.Editor))).toBe(false);
        expect(isContributor(userWithRole(Role.Admin))).toBe(false);
    });
});

describe('canManageUsers', () => {
    it('allows admins only', () => {
        expect(canManageUsers(userWithRole(Role.Admin))).toBe(true);
        expect(canManageUsers(userWithRole(Role.Editor))).toBe(false);
        expect(canManageUsers(userWithRole(Role.Contributor))).toBe(false);
    });
});

describe('canManageTaxonomy', () => {
    it('allows admins only', () => {
        expect(canManageTaxonomy(userWithRole(Role.Admin))).toBe(true);
        expect(canManageTaxonomy(userWithRole(Role.Editor))).toBe(false);
        expect(canManageTaxonomy(userWithRole(Role.Contributor))).toBe(false);
    });
});

describe('canViewAllPosts', () => {
    it('allows editors and admins', () => {
        expect(canViewAllPosts(userWithRole(Role.Editor))).toBe(true);
        expect(canViewAllPosts(userWithRole(Role.Admin))).toBe(true);
    });

    it('denies contributors', () => {
        expect(canViewAllPosts(userWithRole(Role.Contributor))).toBe(false);
    });

    it('denies users without a canvas role', () => {
        expect(canViewAllPosts(userWithRole(null))).toBe(false);
    });
});

describe('canViewAllMedia', () => {
    it('matches post viewAll policy', () => {
        expect(canViewAllMedia(userWithRole(Role.Editor))).toBe(canViewAllPosts(userWithRole(Role.Editor)));
        expect(canViewAllMedia(userWithRole(Role.Contributor))).toBe(canViewAllPosts(userWithRole(Role.Contributor)));
    });
});
