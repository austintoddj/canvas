import { describe, expect, it } from 'vitest';

import { Role } from '@/lib/permissions';
import { parseRoleValue, roleLabel, userInitials } from '@/lib/users/roles';

describe('roleLabel', () => {
    it('labels known roles and falls back for unknown values', () => {
        expect(roleLabel(null)).toBe('No access');
        expect(roleLabel(Role.Contributor)).toBe('Contributor');
        expect(roleLabel(Role.Editor)).toBe('Editor');
        expect(roleLabel(Role.Admin)).toBe('Admin');
        expect(roleLabel(Role.Editor, { 2: 'Staff' })).toBe('Staff');
        expect(roleLabel(99)).toBe('Role 99');
    });
});

describe('parseRoleValue', () => {
    it('parses valid role integers from select values', () => {
        expect(parseRoleValue('1')).toBe(Role.Contributor);
        expect(parseRoleValue('2')).toBe(Role.Editor);
        expect(parseRoleValue('3')).toBe(Role.Admin);
        expect(parseRoleValue('')).toBeNull();
        expect(parseRoleValue('9')).toBeNull();
    });
});

describe('userInitials', () => {
    it('builds initials from a display name', () => {
        expect(userInitials('Ada Lovelace')).toBe('AL');
        expect(userInitials('Madonna')).toBe('MA');
        expect(userInitials('  ')).toBe('?');
    });
});
