import { useCallback, useRef } from 'react';

import { useCanvas } from '@/hooks/useCanvas';
import { usersApi } from '@/lib/api/users';
import { onboardingCompletePayload, shouldMarkOnboardingComplete } from '@/lib/onboarding';

export function useMarkOnboardingComplete(): () => void {
    const { user } = useCanvas();
    const completedRef = useRef(!shouldMarkOnboardingComplete(user));
    const inFlightRef = useRef(false);

    return useCallback(() => {
        if (completedRef.current || inFlightRef.current) {
            return;
        }

        if (!shouldMarkOnboardingComplete(user)) {
            completedRef.current = true;
            return;
        }

        inFlightRef.current = true;

        void usersApi
            .store(String(user.id), onboardingCompletePayload())
            .then(() => {
                completedRef.current = true;
            })
            .catch(() => {
                // Retry on a later successful action if this request fails.
            })
            .finally(() => {
                inFlightRef.current = false;
            });
    }, [user]);
}
