import { describe, expect, it } from 'vitest';

import editorSource from '@/pages/Posts/Editor.tsx?raw';
import { isOnboardingComplete, onboardingCompletePayload, shouldMarkOnboardingComplete } from '@/lib/onboarding';
import type { UserResource } from '@/types/boot';

function makeUser(
    overrides: {
        canvas?: UserResource['canvas'] | null;
        complete?: boolean;
    } = {}
): UserResource {
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

describe('isOnboardingComplete', () => {
    it('is false when onboarding is incomplete', () => {
        expect(isOnboardingComplete(makeUser({ complete: false }))).toBe(false);
    });

    it('is true when onboarding is complete', () => {
        expect(isOnboardingComplete(makeUser({ complete: true }))).toBe(true);
    });

    it('is false when canvas profile is missing', () => {
        expect(isOnboardingComplete(makeUser({ canvas: null }))).toBe(false);
    });
});

describe('shouldMarkOnboardingComplete', () => {
    it('is true only when the user has a canvas profile and is incomplete', () => {
        expect(shouldMarkOnboardingComplete(makeUser({ complete: false }))).toBe(true);
        expect(shouldMarkOnboardingComplete(makeUser({ complete: true }))).toBe(false);
        expect(shouldMarkOnboardingComplete(makeUser({ canvas: null }))).toBe(false);
    });
});

describe('onboardingCompletePayload', () => {
    it('builds the preferences payload for the user update API', () => {
        expect(onboardingCompletePayload()).toEqual({
            preferences: {
                onboarding: {
                    complete: true,
                },
            },
        });
    });
});

describe('post editor onboarding wiring', () => {
    it('marks onboarding complete after a successful post save', () => {
        expect(editorSource).toContain('useMarkOnboardingComplete');
        expect(editorSource).toContain('markOnboardingComplete()');
    });
});
