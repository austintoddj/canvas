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
    it('exposes boot data, translations, and role permissions', () => {
        const editorBoot = bootWithRole(Role.Editor);
        const editor = buildCanvasContextValue(editorBoot);

        expect(editor.boot).toBe(editorBoot);
        expect(editor.user).toBe(editorBoot.user);
        expect(editor.t('hello')).toBe('Hello');
        expect(editor.t('missing')).toBe('missing');
        expect(editor.permissions).toEqual({
            role: Role.Editor,
            isContributor: false,
            isEditor: true,
            isAdmin: false,
            canManageUsers: false,
            canManageTaxonomy: false,
            canViewAllPosts: true,
            canViewAllMedia: true,
        });

        const admin = buildCanvasContextValue(bootWithRole(Role.Admin)).permissions;
        expect(admin.canManageUsers).toBe(true);
        expect(admin.canManageTaxonomy).toBe(true);

        const contributor = buildCanvasContextValue(bootWithRole(Role.Contributor)).permissions;
        expect(contributor.isContributor).toBe(true);
        expect(contributor.canViewAllPosts).toBe(false);
    });
});
