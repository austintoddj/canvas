// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '@/components/button';
import { Heading, Subheading } from '@/components/heading';

describe('page type', () => {
    it('keeps page titles at text-xl with tight tracking', () => {
        render(<Heading>Posts</Heading>);

        const title = screen.getByRole('heading', { name: 'Posts' });
        expect(title.className).toContain('text-xl/8');
        expect(title.className).toContain('tracking-tight');
        expect(title.className).not.toContain('text-2xl');
    });

    it('keeps subheadings at body size below the small breakpoint', () => {
        render(<Subheading>Pipeline</Subheading>);

        const title = screen.getByRole('heading', { name: 'Pipeline' });
        expect(title.className).toContain('text-base/6');
        expect(title.className).toContain('sm:text-sm/6');
    });

    it('uses medium button labels without changing the size scale', () => {
        render(<Button>Save</Button>);

        const button = screen.getByRole('button', { name: 'Save' });
        expect(button.className).toContain('font-medium');
        expect(button.className).not.toContain('font-semibold');
        expect(button.className).toContain('text-base/6');
        expect(button.className).toContain('sm:text-sm/6');
    });
});
