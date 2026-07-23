import { describe, expect, it } from 'vitest';

import { Role } from '@/lib/permissions';
import {
    canGrantAccess,
    canSubmitLookup,
    emptyGrantAccessForm,
    grantAccessPayload,
    normalizeLookupIdentifier,
    roleLabelFromHost,
} from '@/lib/users/grant';
import type { UserLookupResult } from '@/types/api';

function host(overrides: Partial<UserLookupResult> = {}): UserLookupResult {
    return {
        id: 10,
        name: 'Host User',
        email: 'host@example.com',
        avatar_url: 'https://example.com/a.png',
        has_canvas_access: false,
        role: null,
        ...overrides,
    };
}

describe('users grant helpers', () => {
    it('normalizes lookup identifiers and empty form defaults', () => {
        expect(normalizeLookupIdentifier('  writer@example.com  ')).toBe('writer@example.com');
        expect(canSubmitLookup('')).toBe(false);
        expect(canSubmitLookup('   ')).toBe(false);
        expect(canSubmitLookup('1')).toBe(true);
        expect(emptyGrantAccessForm()).toEqual({ identifier: '', role: Role.Contributor });
        expect(emptyGrantAccessForm(Role.Editor).role).toBe(Role.Editor);
    });

    it('only allows grant when the host has no canvas access', () => {
        expect(canGrantAccess(null, false)).toBe(false);
        expect(canGrantAccess(host(), true)).toBe(false);
        expect(canGrantAccess(host({ has_canvas_access: true, role: Role.Editor }), false)).toBe(false);
        expect(canGrantAccess(host(), false)).toBe(true);
    });

    it('builds a role-only grant payload', () => {
        expect(grantAccessPayload(Role.Admin)).toEqual({ role: Role.Admin });
        expect(grantAccessPayload(Role.Contributor)).toEqual({ role: Role.Contributor });
    });

    it('labels existing host roles', () => {
        expect(roleLabelFromHost(host({ role: null }))).toBe('No access');
        expect(roleLabelFromHost(host({ role: Role.Editor }))).toBe('Editor');
        expect(roleLabelFromHost(host({ role: Role.Admin }), { [Role.Admin]: 'Owner' })).toBe('Owner');
    });
});
