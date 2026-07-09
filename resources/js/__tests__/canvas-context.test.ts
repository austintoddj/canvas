import { describe, expect, it } from 'vitest';

import { buildCanvasContextValue } from '@/lib/canvas-context-value';
import { Role } from '@/lib/permissions';
import type { CanvasBoot } from '@/types/boot';

function bootWithRole(role: number): CanvasBoot {
    return {
        path: '/canvas',
        languageCodes: ['en'],
        maxUpload: 3_145_728,
        roles: { 1: 'Contributor', 2: 'Editor', 3: 'Admin' },
        timezone: 'UTC',
        translations: JSON.stringify({ hello: 'Hello' }),
        unsplash: null,
        version: '7.0.0',
        user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: 'https://example.com/avatar.jpg',
            canvas: {
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
        },
    };
}

describe('buildCanvasContextValue', () => {
    it('exposes boot data and user', () => {
        const boot = bootWithRole(Role.Editor);
        const context = buildCanvasContextValue(boot);

        expect(context.boot).toBe(boot);
        expect(context.user).toBe(boot.user);
    });

    it('wires translations into t()', () => {
        const context = buildCanvasContextValue(bootWithRole(Role.Admin));

        expect(context.t('hello')).toBe('Hello');
        expect(context.t('missing')).toBe('missing');
    });

    it('computes permissions for an editor', () => {
        const context = buildCanvasContextValue(bootWithRole(Role.Editor));

        expect(context.permissions).toEqual({
            role: Role.Editor,
            isContributor: false,
            isEditor: true,
            isAdmin: false,
            canManageUsers: false,
            canManageTaxonomy: false,
            canViewAllPosts: true,
            canViewAllMedia: true,
        });
    });

    it('computes permissions for an admin', () => {
        const context = buildCanvasContextValue(bootWithRole(Role.Admin));

        expect(context.permissions.canManageUsers).toBe(true);
        expect(context.permissions.canManageTaxonomy).toBe(true);
    });

    it('computes permissions for a contributor', () => {
        const context = buildCanvasContextValue(bootWithRole(Role.Contributor));

        expect(context.permissions.canViewAllPosts).toBe(false);
        expect(context.permissions.isContributor).toBe(true);
    });
});
