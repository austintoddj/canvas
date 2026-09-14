import { describe, expect, it } from 'vitest';

import type { WebhookEventOption } from '@/lib/api/integrations';
import {
    groupWebhookEventOptions,
    webhookEventGroupId,
    webhookEventGroupLabelFallback,
} from '@/lib/integrations/webhook-event-groups';

const OPTIONS: WebhookEventOption[] = [
    { id: 'post.published', label: 'Published' },
    { id: 'post.scheduled', label: 'Scheduled' },
    { id: 'media.uploaded', label: 'Uploaded' },
];

describe('webhook event groups', () => {
    it('uses the resource prefix as the group id', () => {
        expect(webhookEventGroupId('post.published')).toBe('post');
        expect(webhookEventGroupId('media.uploaded')).toBe('media');
        expect(webhookEventGroupId('webhook')).toBe('webhook');
    });

    it('groups events in first-seen prefix order', () => {
        expect(groupWebhookEventOptions(OPTIONS)).toEqual([
            {
                id: 'post',
                events: [
                    { id: 'post.published', label: 'Published' },
                    { id: 'post.scheduled', label: 'Scheduled' },
                ],
            },
            {
                id: 'media',
                events: [{ id: 'media.uploaded', label: 'Uploaded' }],
            },
        ]);
    });

    it('title-cases unknown group ids', () => {
        expect(webhookEventGroupLabelFallback('post')).toBe('Post');
        expect(webhookEventGroupLabelFallback('')).toBe('');
    });
});
