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
        expect(document.querySelector('[data-empty-state="true"]')).not.toBeNull();
    });
});
