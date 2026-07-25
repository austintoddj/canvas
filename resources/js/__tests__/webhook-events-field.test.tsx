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

describe('WebhookEventsField', () => {
    it('renders event labels, ids, and descriptions', () => {
        render(withCanvas(<ControlledField />));

        expect(screen.getByText('Published')).toBeInTheDocument();
        expect(screen.getByText('post.published')).toBeInTheDocument();
        expect(screen.getByText('When a draft goes live.')).toBeInTheDocument();
        expect(document.querySelector('[data-webhook-event="post.published"]')).not.toBeNull();
    });

    it('selects all and clears the selection', async () => {
        const user = userEvent.setup();
        render(withCanvas(<ControlledField initial={['post.published']} />));

        const selectAll = document.querySelector('[data-webhook-events-select-all="true"]');
        const clear = document.querySelector('[data-webhook-events-clear="true"]');
        expect(selectAll).not.toBeNull();
        expect(clear).not.toBeNull();

        await user.click(selectAll as HTMLElement);

        const controls = OPTIONS.map((option) => document.querySelector(`[data-webhook-event="${option.id}"]`));
        expect(controls.every((el) => el !== null)).toBe(true);
        for (const control of controls) {
            expect(control).toHaveAttribute('data-checked');
        }

        await user.click(clear as HTMLElement);
        for (const control of controls) {
            expect(control).not.toHaveAttribute('data-checked');
        }
    });
});
