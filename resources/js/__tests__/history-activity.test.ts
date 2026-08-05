import { describe, expect, it } from 'vitest';

import { lastEditTooltip } from '@/lib/posts/history-activity';
import type { PostLastRevision } from '@/types/api';

const tip = (overrides: Partial<PostLastRevision> = {}): PostLastRevision => ({
    id: 'rev-1',
    user_id: 2,
    created_at: '2026-07-17T11:37:00.000Z',
    user: {
        id: 2,
        name: 'Becky Austin',
        username: 'becky',
        avatar_url: null,
    },
    ...overrides,
});

const t = (key: string, replacementsOrFallback?: string | Record<string, string | number>, fallback?: string) => {
    const template =
        typeof replacementsOrFallback === 'string'
            ? replacementsOrFallback
            : (fallback ?? key);

    if (typeof replacementsOrFallback === 'object' && replacementsOrFallback !== null) {
        return Object.entries(replacementsOrFallback).reduce(
            (text, [name, value]) => text.replace(`:${name}`, String(value)),
            template
        );
    }

    return template;
};

describe('history-activity', () => {
    it('builds last-edit tooltips for other, self, and unknown actors', () => {
        const now = new Date('2026-07-17T12:00:00.000Z');

        expect(
            lastEditTooltip(tip(), {
                t,
                currentUserId: 1,
                locale: 'en',
                now,
                fallback: 'History',
            })
        ).toMatch(/Becky Austin/);

        expect(
            lastEditTooltip(tip({ user_id: 1 }), {
                t,
                currentUserId: 1,
                locale: 'en',
                now,
                fallback: 'History',
            })
        ).toMatch(/by you/);

        expect(
            lastEditTooltip(tip({ user: null, user_id: 9 }), {
                t,
                currentUserId: 1,
                locale: 'en',
                now,
                fallback: 'History',
            })
        ).toBe('Last edit was 23 minutes ago');

        expect(
            lastEditTooltip(null, {
                t,
                currentUserId: 1,
                locale: 'en',
                now,
                fallback: 'History',
            })
        ).toBe('History');
    });
});
