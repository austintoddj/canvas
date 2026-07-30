// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import RevisionDiff from '@/components/posts/RevisionDiff';

afterEach(() => {
    cleanup();
});

describe('RevisionDiff', () => {
    it('renders green added and red deleted markers', () => {
        render(<RevisionDiff before="Hello world" after="Hello universe" />);

        const root = document.querySelector('[data-revision-diff="true"]');
        expect(root).not.toBeNull();

        const added = document.querySelector('[data-diff-type="added"]');
        const deleted = document.querySelector('[data-diff-type="deleted"]');

        expect(added).not.toBeNull();
        expect(deleted).not.toBeNull();
        expect(added?.className).toMatch(/green/);
        expect(deleted?.className).toMatch(/red/);
        expect(added?.textContent).toMatch(/universe/);
        expect(deleted?.textContent).toMatch(/world/);
    });

    it('shows empty label when there are no changes', () => {
        render(<RevisionDiff before="Same" after="Same" emptyLabel="No changes" />);

        expect(screen.getByText('No changes')).toBeInTheDocument();
        expect(document.querySelector('[data-revision-diff-empty="true"]')).not.toBeNull();
    });
});
