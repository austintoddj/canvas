// @vitest-environment happy-dom

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar } from '@/components/avatar';

describe('Avatar', () => {
    it('clips non-square images to the avatar box', () => {
        const { container } = render(
            <Avatar src="https://example.com/portrait.jpg" className="size-14" alt="Portrait" />
        );

        const root = container.querySelector('[data-slot="avatar"]');
        expect(root).not.toBeNull();
        expect(root!.className).toMatch(/\boverflow-hidden\b/);

        const img = container.querySelector('img');
        expect(img).not.toBeNull();
        expect(img!.className).toMatch(/\bobject-cover\b/);
        expect(img!.className).toMatch(/\bmin-h-0\b/);
        expect(img!.className).toMatch(/\bmin-w-0\b/);
        expect(img!.className).toMatch(/\bsize-full\b/);
    });

    it('keeps the circular clip for round avatars', () => {
        const { container } = render(<Avatar src="https://example.com/a.jpg" className="size-10" alt="" />);

        const root = container.querySelector('[data-slot="avatar"]');
        expect(root!.className).toMatch(/\brounded-full\b/);
        expect(root!.className).toMatch(/\boverflow-hidden\b/);
    });
});
