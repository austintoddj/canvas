// @vitest-environment happy-dom

import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PostBodyEditor from '@/components/posts/PostBodyEditor';
import { renderWithCanvas } from '@/__tests__/helpers/render';

describe('PostBodyEditor toolbar', () => {
    it('keeps the formatting toolbar outside the scrolling body', async () => {
        renderWithCanvas(<PostBodyEditor body="<p>Hello</p>" onChange={() => undefined} />);

        const surface = await waitFor(() => {
            const node = document.querySelector('[data-post-body-surface="true"]');
            expect(node).not.toBeNull();

            return node as HTMLElement;
        });

        expect(surface.className).toMatch(/flex-col/);
        expect(surface.className).toMatch(/overflow-hidden/);

        const toolbar = await waitFor(() => {
            const node = document.querySelector('[data-post-body-toolbar="true"]');
            expect(node).not.toBeNull();

            return node as HTMLElement;
        });
        const scroll = document.querySelector('[data-post-body-scroll="true"]');
        const stats = document.querySelector('[data-post-body-stats="true"]');

        expect(scroll).not.toBeNull();
        expect(scroll?.className).toMatch(/overflow-y-auto/);
        expect(stats).not.toBeNull();
        expect(toolbar.contains(scroll)).toBe(false);
        expect(scroll?.contains(toolbar)).toBe(false);
        expect(surface.firstElementChild).toBe(toolbar);
        expect(toolbar.nextElementSibling).toBe(scroll);
    });
});
