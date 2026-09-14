// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { WebhookEventsField } from '@/components/integrations/WebhookEventsField';
import type { WebhookEventOption } from '@/lib/api/integrations';

import { withCanvas } from './helpers/boot';

const OPTIONS: WebhookEventOption[] = [
    { id: 'post.published', label: 'Published', description: 'When a draft goes live.' },
    { id: 'post.scheduled', label: 'Scheduled', description: 'When a date is set.' },
    { id: 'post.updated', label: 'Updated' },
];

const MIXED: WebhookEventOption[] = [
    ...OPTIONS,
    { id: 'media.uploaded', label: 'Uploaded', description: 'When a file is stored.' },
];

function ControlledField({
    initial = ['post.published'],
    options = OPTIONS,
}: {
    initial?: string[];
    options?: WebhookEventOption[];
}) {
    const [value, setValue] = useState(initial);

    return <WebhookEventsField options={options} value={value} onChange={setValue} />;
}

function eventControls(options: WebhookEventOption[] = OPTIONS) {
    return options.map((option) => document.querySelector(`[data-webhook-event="${option.id}"]`));
}

describe('WebhookEventsField', () => {
    it('renders a Post group expanded with event labels, ids, and descriptions', () => {
        render(withCanvas(<ControlledField />));

        expect(document.querySelector('[data-webhook-event-group="post"]')).not.toBeNull();
        expect(screen.getByText('Post')).toBeInTheDocument();
        expect(screen.getByText('(3)')).toBeInTheDocument();
        expect(document.querySelector('[data-webhook-event-group-toggle="post"]')).toHaveAttribute(
            'aria-expanded',
            'true'
        );

        expect(screen.getByText('Published')).toBeInTheDocument();
        expect(screen.getByText('post.published')).toBeInTheDocument();
        expect(screen.getByText('When a draft goes live.')).toBeInTheDocument();
        expect(document.querySelector('[data-webhook-event="post.published"]')).not.toBeNull();
        const label = screen.getByText('Published').closest('[data-slot="label"]');
        expect(label).toHaveTextContent('post.published');
    });

    it('shows a partial selection count on the group row', () => {
        render(withCanvas(<ControlledField initial={['post.published']} />));

        const count = document.querySelector('[data-webhook-events-selected-count="true"]');
        expect(count).not.toBeNull();
        expect(count).toHaveTextContent('1 of 3 selected');
    });

    it('selects all via the group checkbox, then clears', async () => {
        const user = userEvent.setup();
        render(withCanvas(<ControlledField initial={['post.published']} />));

        const selectGroup = document.querySelector('[data-webhook-events-group-select="post"]');
        expect(selectGroup).not.toBeNull();
        expect(selectGroup).toHaveAttribute('data-indeterminate');

        await user.click(selectGroup as HTMLElement);

        const controls = eventControls();
        expect(controls.every((el) => el !== null)).toBe(true);
        for (const control of controls) {
            expect(control).toHaveAttribute('data-checked');
        }
        expect(selectGroup).toHaveAttribute('data-checked');
        expect(selectGroup).not.toHaveAttribute('data-indeterminate');
        expect(document.querySelector('[data-webhook-events-selected-count="true"]')).toHaveTextContent('All selected');

        await user.click(selectGroup as HTMLElement);
        const cleared = eventControls();
        for (const control of cleared) {
            expect(control).not.toHaveAttribute('data-checked');
        }
        expect(selectGroup).not.toHaveAttribute('data-checked');
        expect(document.querySelector('[data-webhook-events-selected-count="true"]')).toBeNull();
    });

    it('marks All selected when every event in the group is checked individually', async () => {
        const user = userEvent.setup();
        render(withCanvas(<ControlledField initial={['post.published']} />));

        await user.click(document.querySelector('[data-webhook-event="post.scheduled"]') as HTMLElement);
        await user.click(document.querySelector('[data-webhook-event="post.updated"]') as HTMLElement);

        expect(document.querySelector('[data-webhook-events-group-select="post"]')).toHaveAttribute('data-checked');
        expect(document.querySelector('[data-webhook-events-selected-count="true"]')).toHaveTextContent('All selected');
    });

    it('collapses and expands the Post group', async () => {
        const user = userEvent.setup();
        render(withCanvas(<ControlledField />));

        expect(document.querySelector('[data-webhook-event="post.published"]')).not.toBeNull();

        const toggle = document.querySelector('[data-webhook-event-group-toggle="post"]') as HTMLElement;
        await user.click(toggle);

        expect(document.querySelector('[data-webhook-event-group="post"]')).toHaveAttribute('data-expanded', 'false');
        expect(document.querySelector('#webhook-event-group-post')).not.toBeVisible();

        await user.click(document.querySelector('[data-webhook-event-group-toggle="post"]') as HTMLElement);

        expect(document.querySelector('[data-webhook-event-group="post"]')).toHaveAttribute('data-expanded', 'true');
        expect(document.querySelector('#webhook-event-group-post')).toBeVisible();
    });

    it('keeps groups independent when more than one resource exists', async () => {
        const user = userEvent.setup();
        render(withCanvas(<ControlledField options={MIXED} initial={['post.published']} />));

        expect(document.querySelector('[data-webhook-event-group="post"]')).not.toBeNull();
        expect(document.querySelector('[data-webhook-event-group="media"]')).not.toBeNull();
        expect(screen.getByText('Media')).toBeInTheDocument();
        expect(document.querySelector('[data-webhook-event="media.uploaded"]')).not.toBeNull();

        await user.click(document.querySelector('[data-webhook-events-group-select="post"]') as HTMLElement);

        expect(document.querySelector('[data-webhook-event="post.published"]')).toHaveAttribute('data-checked');
        expect(document.querySelector('[data-webhook-event="post.updated"]')).toHaveAttribute('data-checked');
        expect(document.querySelector('[data-webhook-event="media.uploaded"]')).not.toHaveAttribute('data-checked');
        expect(
            document.querySelector('[data-webhook-event-group="post"] [data-webhook-events-selected-count="true"]')
        ).toHaveTextContent('All selected');
    });
});
