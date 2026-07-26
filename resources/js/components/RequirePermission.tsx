import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import { usePermissions } from '@/hooks/usePermissions';
import type { CanvasPermissions } from '@/lib/canvas-context-value';

type PermissionKey = keyof CanvasPermissions;

type RequirePermissionProps = {
    permission: PermissionKey;
    children: ReactNode;
};

/**
 * Silent redirect home when the current user lacks the given permission.
 * Admin-only routes should never show load errors to non-admins.
 */
export function RequirePermission({ permission, children }: RequirePermissionProps) {
    const permissions = usePermissions();

    if (!permissions[permission]) {
        return <Navigate to="/" replace />;
    }

    return children;
}
