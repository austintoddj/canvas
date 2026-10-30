// @vitest-environment happy-dom

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Toaster } from '@/components/Toaster';
import { loadTranslations } from '@/lib/i18n';
import { dismissToast, getToasts, toast } from '@/lib/toast';

describe('Toaster', () => {
    beforeEach(() => {
        dismissToast();
        loadTranslations(
            JSON.stringify({
                'common.dismiss_notification': 'Dismiss notification',
                'common.notifications': 'Notifications',
            })
        );
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

        const toastCard = screen.getByRole('alert');
        expect(toastCard.className).toContain('shadow-lg');
        expect(toastCard.className).toContain('ring-zinc-950/10');
        expect(toastCard.className).toContain('sm:max-w-sm');
        expect(toastCard.className).not.toMatch(/(^|\s)border(\s|$)/);
        expect(toastCard.className).not.toMatch(/(^|\s)max-w-sm(\s|$)/);
        expect(document.querySelector('[data-toaster]')?.className).toContain('safe-area-inset-bottom');

        const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss notification' });
        await user.click(dismissButtons[0]!);

        await waitFor(() => {
            expect(getToasts().some((item) => item.message === 'Upload complete')).toBe(false);
        });
        expect(screen.getByText('Something failed')).toBeInTheDocument();
    });
});
