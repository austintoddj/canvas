// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LoadError } from '@/components/LoadError';
import { withCanvas } from './helpers/boot';

describe('LoadError', () => {
    it('shows the message and a plain full-width Try again button', async () => {
        const onRetry = vi.fn();

        render(withCanvas(<LoadError message="Unable to load posts." onRetry={onRetry} />));

        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Unable to load posts.');

        const button = screen.getByRole('button', { name: 'Try again' });
        const buttonClasses = button.className.split(/\s+/);
        expect(buttonClasses).toContain('min-h-11');
        expect(buttonClasses).toContain('w-full');
        expect(buttonClasses).toContain('sm:min-h-0');
        expect(buttonClasses).toContain('sm:w-auto');
        expect(buttonClasses).toContain('border-transparent');

        const row = alert.parentElement;
        const rowClasses = row?.className.split(/\s+/) ?? [];
        expect(rowClasses).toContain('flex-col');
        expect(rowClasses).toContain('sm:flex-row');
        expect(row?.querySelector('[class*="border-red"]')).toBeNull();

        await userEvent.click(button);
        expect(onRetry).toHaveBeenCalledOnce();
    });
});
