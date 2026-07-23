import type { UserStorePayload } from '@/types/api';
import type { UserResource } from '@/types/boot';

export function isOnboardingComplete(user: UserResource): boolean {
    return user.canvas?.preferences.onboarding.complete === true;
}

export function onboardingCompletePayload(): UserStorePayload {
    return {
        preferences: {
            onboarding: {
                complete: true,
            },
        },
    };
}

export function shouldMarkOnboardingComplete(user: UserResource): boolean {
    return user.canvas != null && !isOnboardingComplete(user);
}
