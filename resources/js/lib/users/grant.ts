import type { RoleValue } from '@/lib/permissions';
import { Role } from '@/lib/permissions';
import { roleLabel } from '@/lib/users/roles';
import type { UserLookupResult, UserStorePayload } from '@/types/api';

export type GrantAccessFormState = {
    identifier: string;
    role: RoleValue;
};

export function emptyGrantAccessForm(defaultRole: RoleValue = Role.Contributor): GrantAccessFormState {
    return {
        identifier: '',
        role: defaultRole,
    };
}

export function normalizeLookupIdentifier(value: string): string {
    return value.trim();
}

export function canSubmitLookup(identifier: string): boolean {
    return normalizeLookupIdentifier(identifier).length > 0;
}

export function canGrantAccess(host: UserLookupResult | null, granting: boolean): boolean {
    return host !== null && !host.has_canvas_access && !granting;
}

export function grantAccessPayload(role: RoleValue): UserStorePayload {
    return { role };
}

export function roleLabelFromHost(host: UserLookupResult, labels?: Record<number, string>): string {
    if (host.role === null) {
        return roleLabel(null, labels);
    }

    if (labels !== undefined && labels[host.role] !== undefined) {
        return labels[host.role];
    }

    if (host.role === Role.Contributor || host.role === Role.Editor || host.role === Role.Admin) {
        return roleLabel(host.role, labels);
    }

    return `Role ${host.role}`;
}
