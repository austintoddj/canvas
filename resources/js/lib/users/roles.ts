import { t } from '@/lib/i18n';
import { Role, type RoleValue } from '@/lib/permissions';

const ROLE_LABEL_KEYS: Record<RoleValue, string> = {
    [Role.Contributor]: 'users.role_contributor',
    [Role.Editor]: 'users.role_editor',
    [Role.Admin]: 'users.role_admin',
};

const DEFAULT_ROLE_LABELS: Record<RoleValue, string> = {
    [Role.Contributor]: 'Contributor',
    [Role.Editor]: 'Editor',
    [Role.Admin]: 'Admin',
};

export const ROLE_OPTIONS: { value: RoleValue; labelKey: string; label: string }[] = [
    {
        value: Role.Contributor,
        labelKey: ROLE_LABEL_KEYS[Role.Contributor],
        label: DEFAULT_ROLE_LABELS[Role.Contributor],
    },
    { value: Role.Editor, labelKey: ROLE_LABEL_KEYS[Role.Editor], label: DEFAULT_ROLE_LABELS[Role.Editor] },
    { value: Role.Admin, labelKey: ROLE_LABEL_KEYS[Role.Admin], label: DEFAULT_ROLE_LABELS[Role.Admin] },
];

export function roleLabel(role: number | null | undefined, labels?: Record<number, string>): string {
    if (role === null || role === undefined) {
        return t('users.no_access', 'No access');
    }

    if (labels !== undefined && labels[role] !== undefined) {
        return labels[role];
    }

    if (role === Role.Contributor || role === Role.Editor || role === Role.Admin) {
        return t(ROLE_LABEL_KEYS[role], DEFAULT_ROLE_LABELS[role]);
    }

    return `Role ${role}`;
}

export function parseRoleValue(value: string): RoleValue | null {
    const parsed = Number.parseInt(value, 10);

    if (parsed === Role.Contributor || parsed === Role.Editor || parsed === Role.Admin) {
        return parsed;
    }

    return null;
}

export function userInitials(name: string): string {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter((part) => part.length > 0);

    if (parts.length === 0) {
        return '?';
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}
