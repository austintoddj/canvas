// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AssetsOutdatedCallout } from '@/components/AssetsOutdatedCallout';

import { withCanvas } from './helpers/boot';

describe('AssetsOutdatedCallout', () => {
    it('shows the publish command and docs link', () => {
        render(withCanvas(<AssetsOutdatedCallout />));

        expect(screen.getByRole('status')).toHaveAttribute('data-assets-outdated', 'true');
        expect(screen.getByText('Assets are not up to date')).toBeInTheDocument();
        expect(screen.getByText('php artisan canvas:publish')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Upgrade docs/i })).toHaveAttribute(
            'href',
            'https://github.com/austintoddj/canvas#upgrading'
        );
    });
});
