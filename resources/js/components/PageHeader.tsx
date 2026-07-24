import type { ReactNode } from 'react';

import { Heading } from '@/components/heading';

type PageHeaderProps = {
    title: string;
    actions?: ReactNode;
    children?: ReactNode;
};

export function PageHeader({ title, actions, children }: PageHeaderProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
                <Heading>{title}</Heading>
                {children}
            </div>
            {actions ? <div className="hidden flex-wrap items-center gap-2 lg:flex">{actions}</div> : null}
        </div>
    );
}
