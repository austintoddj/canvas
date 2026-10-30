// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SearchField } from '@/components/SearchField';

describe('SearchField', () => {
    it('renders a quiet pill with a 16px phone field and a focus ring', async () => {
        const onChange = vi.fn();

        render(<SearchField id="posts-search" label="Search posts" value="" onChange={onChange} />);

        const input = screen.getByRole('searchbox', { name: 'Search posts' });
        const inputClasses = input.className.split(/\s+/);
        expect(inputClasses).toContain('text-base/6');
        expect(inputClasses).toContain('sm:text-sm/6');
        expect(inputClasses).not.toContain('text-sm');

        const pill = input.parentElement;
        const pillClasses = pill?.className.split(/\s+/) ?? [];
        expect(pillClasses).toContain('h-9');
        expect(pillClasses).toContain('sm:h-8');
        expect(pillClasses).toContain('rounded-full');
        expect(pillClasses).toContain('focus-within:ring-2');
        expect(pillClasses).toContain('focus-within:ring-blue-500');
        expect(pillClasses).not.toContain('focus-within:ring-offset-2');
        expect(pill?.querySelector('[class*="border-red"]')).toBeNull();

        await userEvent.type(input, 'a');
        expect(onChange).toHaveBeenCalledWith('a');
    });
});
