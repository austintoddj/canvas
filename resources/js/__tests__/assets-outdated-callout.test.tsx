// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AssetsOutdatedCallout } from '@/components/AssetsOutdatedCallout';

import { withCanvas } from './helpers/boot';

describe('AssetsOutdatedCallout', () => {
    it('shows the publish command and docs link', () => {
        render(withCanvas(<AssetsOutdatedCallout />));

        const status = screen.getByRole('status');
        expect(status).toHaveAttribute('data-assets-outdated', 'true');
        expect(status.className).toMatch(/flex-col/);
        expect(status.className).not.toMatch(/flex-row/);
        expect(status.className).not.toMatch(/red-/);
        expect(status.className).toMatch(/border-zinc-950\/10/);
        expect(status.querySelector('.rounded-full.bg-amber-500')).not.toBeNull();
        expect(screen.getByText('Assets are not up to date')).toBeInTheDocument();
        expect(screen.queryByText('To update, run:')).toBeNull();

        const command = screen.getByText('php artisan canvas:publish');
        expect(command.className).toMatch(/whitespace-nowrap/);
        expect(command.className).toMatch(/overflow-x-auto/);

        expect(screen.getByRole('link', { name: /Upgrade docs/i })).toHaveAttribute(
            'href',
            'https://github.com/austintoddj/canvas#upgrading'
        );
    });
});
