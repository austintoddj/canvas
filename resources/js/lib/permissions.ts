import type { UserResource } from '@/types/boot';

/** Mirrors `Canvas\Enums\Role` integer values. */
export const Role = {
    Contributor: 1,
    Editor: 2,
    Admin: 3,
} as const;

export type RoleValue = (typeof Role)[keyof typeof Role];

export function canvasRole(user: UserResource): number | null {
    return user.canvas?.role ?? null;
}

export function hasCanvasAccess(user: UserResource): boolean {
    return canvasRole(user) !== null;
}

export function isContributor(user: UserResource): boolean {
    return canvasRole(user) === Role.Contributor;
}

export function isEditor(user: UserResource): boolean {
    return canvasRole(user) === Role.Editor;
}

export function isAdmin(user: UserResource): boolean {
    return canvasRole(user) === Role.Admin;
}

/** Gate: `manage-users` — Admin only. */
export function canManageUsers(user: UserResource): boolean {
    return isAdmin(user);
}

/** Gate: `manage-taxonomy` — Admin only. */
export function canManageTaxonomy(user: UserResource): boolean {
    return isAdmin(user);
}

/** Gate: `manage-settings` — Admin only. */
export function canManageSettings(user: UserResource): boolean {
    return isAdmin(user);
}

/** Policy: `viewAll` on `Post` — Editor and Admin; Contributors see own content only. */
export function canViewAllPosts(user: UserResource): boolean {
    const role = canvasRole(user);

    return role !== null && role !== Role.Contributor;
}

/** Policy: `viewAll` on `Media` — Editor and Admin; Contributors see own content only. */
export function canViewAllMedia(user: UserResource): boolean {
    return canViewAllPosts(user);
}
