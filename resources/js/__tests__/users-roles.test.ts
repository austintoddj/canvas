import { describe, expect, it } from 'vitest';

import { Role } from '@/lib/permissions';
import { parseRoleValue, roleLabel, userInitials } from '@/lib/users/roles';

describe('user role helpers', () => {
    it('labels roles, parses select values, and builds initials', () => {
        expect(roleLabel(null)).toBe('No access');
        expect(roleLabel(Role.Contributor)).toBe('Contributor');
        expect(roleLabel(Role.Editor, { 2: 'Staff' })).toBe('Staff');
        expect(roleLabel(99)).toBe('Role 99');

        expect(parseRoleValue('1')).toBe(Role.Contributor);
        expect(parseRoleValue('3')).toBe(Role.Admin);
        expect(parseRoleValue('')).toBeNull();
        expect(parseRoleValue('9')).toBeNull();

        expect(userInitials('Ada Lovelace')).toBe('AL');
        expect(userInitials('Madonna')).toBe('MA');
        expect(userInitials('  ')).toBe('?');
    });
});
