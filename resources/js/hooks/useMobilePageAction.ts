import { useLayoutEffect, useRef } from 'react';

import { useMobilePageActionState, type MobilePageActionContribution } from '@/contexts/MobilePageActionContext';

function contributionSignature(contribution: MobilePageActionContribution): string {
    return [
        contribution.visible === false ? '0' : contribution.visible === true ? '1' : '',
        contribution.label ?? '',
        contribution.disabled ? '1' : '0',
        contribution.onClick ? '1' : '0',
    ].join('\0');
}

/**
 * Refines the route-default mobile navbar action for the current page.
 * Pass `{ visible: false }` when an empty state owns the primary CTA.
 * `onClick` always invokes the latest handler via ref.
 */
export function useMobilePageAction(contribution: MobilePageActionContribution): void {
    const { setContribution } = useMobilePageActionState();
    const latestRef = useRef(contribution);
    const signature = contributionSignature(contribution);

    // Keep the latest contribution for onClick without updating refs during render.
    useLayoutEffect(() => {
        latestRef.current = contribution;
    }, [contribution]);

    useLayoutEffect(() => {
        const current = latestRef.current;

        setContribution({
            visible: current.visible,
            label: current.label,
            disabled: current.disabled,
            onClick:
                current.onClick !== undefined
                    ? () => {
                          latestRef.current.onClick?.();
                      }
                    : undefined,
        });

        return () => {
            // Leave route chrome in place during Suspense; provider clears on path change.
            setContribution({});
        };
    }, [signature, setContribution]);
}
