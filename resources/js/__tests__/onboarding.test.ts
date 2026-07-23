import { describe, expect, it } from 'vitest';

import { isOnboardingComplete, onboardingCompletePayload, shouldMarkOnboardingComplete } from '@/lib/onboarding';
import type { UserResource } from '@/types/boot';

function makeUser(overrides: { canvas?: UserResource['canvas'] | null; complete?: boolean } = {}): UserResource {
    const baseCanvas: NonNullable<UserResource['canvas']> = {
        role: 1,
        username: 'author',
        summary: null,
        avatar: null,
        avatar_url: 'https://example.com/a.png',
        website: null,
        social: {},
        locale: 'en',
        timezone: 'UTC',
        theme: 'system',
        digest: false,
        preferences: {
            onboarding: {
                complete: overrides.complete ?? false,
            },
        },
    };

    return {
        id: 7,
        name: 'Author',
        email: 'author@example.com',
        avatar_url: 'https://example.com/a.png',
        canvas: overrides.canvas === null ? undefined : (overrides.canvas ?? baseCanvas),
    };
}

describe('onboarding helpers', () => {
    it('tracks completion state and builds the user update payload', () => {
        expect(isOnboardingComplete(makeUser({ complete: false }))).toBe(false);
        expect(isOnboardingComplete(makeUser({ complete: true }))).toBe(true);
        expect(isOnboardingComplete(makeUser({ canvas: null }))).toBe(false);

        expect(shouldMarkOnboardingComplete(makeUser({ complete: false }))).toBe(true);
        expect(shouldMarkOnboardingComplete(makeUser({ complete: true }))).toBe(false);
        expect(shouldMarkOnboardingComplete(makeUser({ canvas: null }))).toBe(false);

        expect(onboardingCompletePayload()).toEqual({
            preferences: { onboarding: { complete: true } },
        });
    });
});
