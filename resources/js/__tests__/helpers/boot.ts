import { CanvasContext, type CanvasContextValue } from '@/contexts/CanvasContext';
import { buildCanvasContextValue } from '@/lib/canvas-context-value';
import { Role } from '@/lib/permissions';
import type { CanvasBoot, UserResource } from '@/types/boot';
import { createElement, type ReactElement, type ReactNode } from 'react';

export function makeUser(role: number | null = Role.Admin, overrides: Partial<UserResource> = {}): UserResource {
    return {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        canvas:
            role === null
                ? undefined
                : {
                      role,
                      username: 'test-user',
                      summary: null,
                      avatar: null,
                      avatar_url: 'https://example.com/avatar.jpg',
                      website: null,
                      social: {},
                      locale: 'en',
                      timezone: 'UTC',
                      theme: 'system',
                      digest: false,
                      preferences: {},
                  },
        ...overrides,
    };
}

export function makeBoot(overrides: Partial<CanvasBoot> = {}): CanvasBoot {
    return {
        path: '/canvas',
        languages: [{ code: 'en', label: 'English', rtl: false }],
        maxUpload: 5120,
        roles: {
            [Role.Contributor]: 'Contributor',
            [Role.Editor]: 'Editor',
            [Role.Admin]: 'Admin',
        },
        appTimezone: 'UTC',
        defaultLocale: 'en',
        translations: JSON.stringify({
            'common.close': 'Close',
            'common.cancel': 'Cancel',
            'editor.publish_dialog_title': 'Looks good to me.',
            'editor.publish_dialog_subtitle': 'Choose when readers should see it.',
            'editor.publish_needs_title': 'Add a title before publishing.',
            'editor.publish_timing_label': 'When to publish',
            'editor.publish_now': 'Publish now',
            'editor.schedule_for_later': 'Schedule for later',
            'editor.publish_now_help': 'The post goes live immediately.',
            'editor.schedule_time': 'Time',
            'editor.schedule_prev_month': 'Previous month',
            'editor.schedule_next_month': 'Next month',
            'editor.schedule_pick': 'Choose a date and time',
            'editor.schedule_timezone_hint': "Times are chosen in this device's local timezone.",
            'editor.schedule_app_timezone': 'App: :timezone · :when',
            'editor.schedule_presets.in_one_hour': 'In 1 hour',
            'editor.schedule_presets.tomorrow_morning': 'Tomorrow 9am',
            'editor.schedule_presets.next_monday': 'Next Monday',
            'editor.scheduling': 'Scheduling…',
            'editor.publishing': 'Publishing…',
            'editor.schedule': 'Schedule',
            'editor.publish': 'Publish',
            assets_are_not_up_to_date: 'Assets are not up to date',
            to_update_run: 'To update, run:',
            assets_docs_link: 'Upgrade docs',
        }),
        unsplash: false,
        ai: false,
        assetsUpToDate: true,
        version: '7.0.0-test',
        user: makeUser(Role.Admin),
        ...overrides,
    };
}

export function makeCanvasValue(boot: CanvasBoot = makeBoot()): CanvasContextValue {
    return buildCanvasContextValue(boot);
}

export function withCanvas(ui: ReactNode, boot: CanvasBoot = makeBoot()): ReactElement {
    const value = makeCanvasValue(boot);

    return createElement(CanvasContext.Provider, { value }, ui);
}
