// @vitest-environment happy-dom

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Toaster } from '@/components/Toaster';
import { dismissToast, getToasts, toast } from '@/lib/toast';

describe('Toaster', () => {
    beforeEach(() => {
        dismissToast();
    });

    afterEach(() => {
        dismissToast();
        vi.useRealTimers();
    });

    it('renders toast messages and dismisses them', async () => {
        const user = userEvent.setup();
        render(<Toaster />);

        act(() => {
            toast.success('Upload complete');
            toast.error('Something failed');
        });

        expect(screen.getByText('Upload complete')).toBeInTheDocument();
        expect(screen.getByText('Something failed')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveAttribute('data-toast-tone', 'error');

        const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss notification' });
        await user.click(dismissButtons[0]!);

        await waitFor(() => {
            expect(getToasts().some((item) => item.message === 'Upload complete')).toBe(false);
        });
        expect(screen.getByText('Something failed')).toBeInTheDocument();
    });
});
