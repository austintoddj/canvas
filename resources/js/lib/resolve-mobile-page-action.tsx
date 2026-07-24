import type { ReactNode } from 'react';
import { IconPlus, IconUpload } from '@tabler/icons-react';

import type { MobilePageActionContribution } from '@/contexts/MobilePageActionContext';
import { mobilePageActionKindForPath, type MobilePageActionKind } from '@/lib/mobile-page-action';

export type ResolvedMobilePageAction = {
    label: string;
    icon: ReactNode;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
};

type Translate = (
    key: string,
    replacementsOrFallback?: string | Record<string, string | number>,
    fallback?: string
) => string;

type ResolveOptions = {
    pathname: string;
    t: Translate;
    contribution: MobilePageActionContribution;
    canManageTaxonomy?: boolean;
    canManageUsers?: boolean;
};

function iconPlus(): ReactNode {
    return <IconPlus data-slot="icon" />;
}

function iconUpload(): ReactNode {
    return <IconUpload data-slot="icon" />;
}

function kindAllowed(
    kind: MobilePageActionKind,
    options: Pick<ResolveOptions, 'canManageTaxonomy' | 'canManageUsers'>
): boolean {
    if (kind === 'new-taxonomy' && options.canManageTaxonomy === false) {
        return false;
    }

    if (kind === 'invite' && options.canManageUsers === false) {
        return false;
    }

    return true;
}

/**
 * Merges the route default with the mounted page’s contribution.
 * Route defaults keep the control visible through lazy load + list fetch.
 */
export function resolveMobilePageAction(options: ResolveOptions): ResolvedMobilePageAction | null {
    const kind = mobilePageActionKindForPath(options.pathname);

    if (kind === null || !kindAllowed(kind, options)) {
        return null;
    }

    if (options.contribution.visible === false) {
        return null;
    }

    switch (kind) {
        case 'new-post':
            return {
                label: options.contribution.label ?? options.t('posts.new'),
                href: '/posts/new',
                icon: iconPlus(),
            };
        case 'upload':
            return {
                label: options.contribution.label ?? options.t('media.upload'),
                icon: iconUpload(),
                disabled: options.contribution.disabled,
                onClick: options.contribution.onClick,
            };
        case 'new-taxonomy':
            return {
                label: options.contribution.label ?? options.t('organize.new_topic'),
                icon: iconPlus(),
                disabled: options.contribution.disabled,
                onClick: options.contribution.onClick,
            };
        case 'invite':
            return {
                label: options.contribution.label ?? options.t('users.invite'),
                icon: iconPlus(),
                disabled: options.contribution.disabled,
                onClick: options.contribution.onClick,
            };
    }
}
