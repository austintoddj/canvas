import type { ReactNode } from 'react';
import { IconArrowLeft } from '@tabler/icons-react';

import { Button } from '@/components/button';
import { useCanvas } from '@/hooks/useCanvas';
import { cn } from '@/lib/utils';

type IntegrationPageShellProps = {
    children: ReactNode;
    className?: string;
};

/** Shared width + back control for integration detail routes (including loading/error). */
export function IntegrationPageShell({ children, className }: IntegrationPageShellProps) {
    const { t } = useCanvas();

    return (
        <div className={cn('space-y-8', className)} data-integration-page="true">
            <div>
                <Button href="/integrations" plain data-integration-back>
                    <IconArrowLeft data-slot="icon" />
                    {t('integrations.title')}
                </Button>
            </div>
            {children}
        </div>
    );
}
