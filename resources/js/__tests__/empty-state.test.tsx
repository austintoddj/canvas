// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '@/components/EmptyState';

describe('EmptyState', () => {
    it('renders headline, description, and optional action', () => {
        render(
            <EmptyState
                headline="No posts yet"
                description="Write your first story."
                action={<button type="button">New post</button>}
            />
        );

        expect(screen.getByRole('heading', { name: 'No posts yet' })).toBeInTheDocument();
        expect(screen.getByText('Write your first story.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'New post' })).toBeInTheDocument();

        const root = document.querySelector('[data-empty-state="true"]');
        expect(root).not.toBeNull();
        const classes = root?.className.split(/\s+/) ?? [];
        expect(classes).toContain('rounded-2xl');
        expect(classes).toContain('px-6');
        expect(classes).toContain('py-10');
        expect(classes).not.toContain('rounded-3xl');
        expect(classes).not.toContain('py-14');
        expect(classes).not.toContain('sm:px-10');
        expect(root?.querySelector('[class*="radial-gradient"]')).toBeNull();

        const heading = screen.getByRole('heading', { name: 'No posts yet' });
        expect(heading.className.split(/\s+/)).toContain('text-xl');
        expect(heading.className.split(/\s+/)).toContain('tracking-tight');
        expect(heading.className).not.toContain('sm:text-2xl');

        const action = screen.getByRole('button', { name: 'New post' }).parentElement;
        expect(action?.className.split(/\s+/)).toContain('w-full');
        expect(action?.className.split(/\s+/)).toContain('sm:w-auto');
    });
});
