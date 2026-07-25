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

function ControlledField({ initial = ['post.published'] }: { initial?: string[] }) {
    const [value, setValue] = useState(initial);

    return <WebhookEventsField options={OPTIONS} value={value} onChange={setValue} />;
}

function eventControls() {
    return OPTIONS.map((option) => document.querySelector(`[data-webhook-event="${option.id}"]`));
}

describe('WebhookEventsField', () => {
    it('renders event labels, ids, and descriptions', () => {
        render(withCanvas(<ControlledField />));

        expect(screen.getByText('Published')).toBeInTheDocument();
        expect(screen.getByText('post.published')).toBeInTheDocument();
        expect(screen.getByText('When a draft goes live.')).toBeInTheDocument();
        expect(document.querySelector('[data-webhook-event="post.published"]')).not.toBeNull();
    });

    it('shows the selection count in the list header', () => {
        render(withCanvas(<ControlledField initial={['post.published']} />));

        const count = document.querySelector('[data-webhook-events-selected-count="true"]');
        expect(count).not.toBeNull();
        expect(count).toHaveTextContent('1 of 3 selected');
    });

    it('selects all via the master checkbox, then clears', async () => {
        const user = userEvent.setup();
        render(withCanvas(<ControlledField initial={['post.published']} />));

        const selectAll = document.querySelector('[data-webhook-events-select-all="true"]');
        expect(selectAll).not.toBeNull();
        expect(selectAll).toHaveAttribute('data-indeterminate');

        await user.click(selectAll as HTMLElement);

        const controls = eventControls();
        expect(controls.every((el) => el !== null)).toBe(true);
        for (const control of controls) {
            expect(control).toHaveAttribute('data-checked');
        }
        expect(selectAll).toHaveAttribute('data-checked');
        expect(selectAll).not.toHaveAttribute('data-indeterminate');
        expect(document.querySelector('[data-webhook-events-selected-count="true"]')).toHaveTextContent(
            '3 of 3 selected'
        );

        await user.click(selectAll as HTMLElement);
        for (const control of controls) {
            expect(control).not.toHaveAttribute('data-checked');
        }
        expect(selectAll).not.toHaveAttribute('data-checked');
        expect(document.querySelector('[data-webhook-events-selected-count="true"]')).toHaveTextContent(
            '0 of 3 selected'
        );
    });
});
