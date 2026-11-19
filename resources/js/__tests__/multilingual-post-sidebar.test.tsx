// @vitest-environment happy-dom

import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import PostSidebar from '@/components/posts/PostSidebar';
import { makeBoot } from '@/__tests__/helpers/boot';
import { renderWithCanvas } from '@/__tests__/helpers/render';

it('keeps translated excerpts editable while locking the shared slug', () => {
    renderWithCanvas(
        <PostSidebar
            form={{
                title: '',
                slug: 'shared',
                summary: '',
                body: null,
                publishedAt: null,
                featuredImage: null,
                featuredImageCaption: null,
                meta: null,
                tags: [],
                topic: null,
                author: null,
            }}
            onChange={() => undefined}
            availableTags={[]}
            availableTopics={[]}
            fieldErrors={{}}
            sharedReadOnly
        />,
        { boot: makeBoot({ translations: { 'editor.slug': 'Slug', 'editor.summary': 'Excerpt' } }) }
    );
    expect(screen.getByRole('textbox', { name: 'Slug' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Excerpt' })).toBeEnabled();
});
