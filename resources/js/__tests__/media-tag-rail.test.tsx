// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MediaTagRail } from '@/components/media/MediaTagRail';
import { makeBoot, withCanvas } from '@/__tests__/helpers/boot';

const translations = {
    'media.tags': 'Tags',
    'media.tags_all': 'All images',
    'media.tags_untagged': 'Untagged',
    'media.tags_filter': 'Filter by tag',
    'media.tags_new': 'New tag',
    'media.tags_rename': 'Rename tag',
    'media.tags_delete': 'Delete tag',
};

const tags = [
    { id: 'tag-1', name: 'Hero', media_count: 12 },
    { id: 'tag-2', name: 'Homepage', media_count: 4 },
];

function renderRail(props: Partial<React.ComponentProps<typeof MediaTagRail>> = {}) {
    return render(
        withCanvas(
            <MediaTagRail
                tags={tags}
                allCount={42}
                untaggedCount={7}
                selectedTagId={null}
                untagged={false}
                canManage={false}
                onSelectAll={() => undefined}
                onSelectUntagged={() => undefined}
                onSelectTag={() => undefined}
                {...props}
            />,
            makeBoot({ translations })
        )
    );
}

describe('MediaTagRail', () => {
    it('renders all, untagged, and user tags as pills without a sidebar', () => {
        const { container } = renderRail();

        expect(screen.getByRole('navigation', { name: 'Tags' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'All images' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Untagged' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Hero' })).toBeInTheDocument();
        expect(screen.queryByText('12')).toBeNull();
        const rail = container.querySelector('[data-media-tag-rail="true"]');

        expect(rail?.className).toContain('flex');
        expect(rail?.className).toContain('overflow-x-clip');
        expect(rail?.className).not.toContain('overflow-x-auto');
        expect(rail?.className).not.toContain('lg:flex');
    });

    it('does not highlight all when an unknown tag is selected', () => {
        renderRail({ selectedTagId: 'missing' });

        expect(screen.getByRole('button', { name: 'All images' })).not.toHaveAttribute('aria-current', 'true');
        expect(screen.getByRole('button', { name: 'All images' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('opens overflow for new tag and extra tags', async () => {
        const onCreate = vi.fn();
        const extra = Array.from({ length: 5 }, (_, index) => ({
            id: `extra-${index}`,
            name: `Extra ${index}`,
            media_count: index,
        }));

        renderRail({ tags: [...tags, ...extra], onCreate });

        await userEvent.click(screen.getByRole('button', { name: 'Filter by tag' }));
        expect(await screen.findByRole('menuitem', { name: 'New tag' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Extra 4/ })).toBeInTheDocument();
    });

    it('pins a selected tag into the visible pills when it would overflow', () => {
        const many = Array.from({ length: 6 }, (_, index) => ({
            id: `tag-${index}`,
            name: `Tag ${index}`,
            media_count: 1,
        }));

        renderRail({ tags: many, selectedTagId: 'tag-5' });

        expect(screen.getByRole('button', { name: 'Tag 5' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Tag 4' })).toBeNull();
    });
});
