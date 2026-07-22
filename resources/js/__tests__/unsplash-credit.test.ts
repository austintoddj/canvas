import { describe, expect, it } from 'vitest';

import {
    buildUnsplashBodyInsertHtml,
    formatUnsplashAlt,
    formatUnsplashCredit,
    unsplashPhotographerName,
} from '@/lib/media/unsplash-credit';
import type { UnsplashPhoto } from '@/types/api';

const t: (key: string, replacements?: Record<string, string | number>, fallback?: string) => string = (
    key,
    replacements,
    fallback
) => {
    if (key === 'unsplash.photo_by_on' && replacements?.name !== undefined) {
        return `Photo by ${replacements.name} on Unsplash`;
    }

    return fallback ?? key;
};

function photo(overrides: Partial<UnsplashPhoto> & { user?: Partial<UnsplashPhoto['user']> } = {}): UnsplashPhoto {
    const { user: userOverrides, ...rest } = overrides;

    return {
        id: 'abc',
        width: 100,
        height: 80,
        urls: {
            raw: 'https://images.unsplash.com/raw',
            full: 'https://images.unsplash.com/full',
            regular: 'https://images.unsplash.com/regular',
            small: 'https://images.unsplash.com/small',
            thumb: 'https://images.unsplash.com/thumb',
        },
        alt_description: null,
        description: null,
        ...rest,
        user: {
            name: 'Jane Doe',
            links: { html: 'https://unsplash.com/@jane' },
            ...userOverrides,
        },
    };
}

describe('unsplash credit helpers', () => {
    it('formats photographer credit as plain text', () => {
        expect(unsplashPhotographerName(photo())).toBe('Jane Doe');
        expect(formatUnsplashCredit(photo(), t)).toBe('Photo by Jane Doe on Unsplash');
    });

    it('falls back when photographer name is blank', () => {
        expect(formatUnsplashCredit(photo({ user: { name: '  ', links: { html: '' } } }), t)).toBe(
            'Photo by Unsplash on Unsplash'
        );
    });

    it('prefers alt_description then description for alt text', () => {
        expect(formatUnsplashAlt(photo({ alt_description: 'A red flag' }), t)).toBe('A red flag');
        expect(formatUnsplashAlt(photo({ description: 'Mountain lake' }), t)).toBe('Mountain lake');
        expect(formatUnsplashAlt(photo({ alt_description: '  ', description: '  ' }), t)).toBe(
            'Photo by Jane Doe on Unsplash'
        );
    });

    it('always uses credit for caption path regardless of descriptions', () => {
        expect(
            formatUnsplashCredit(
                photo({
                    alt_description: 'A portrait',
                    description: 'Detailed caption from Unsplash',
                }),
                t
            )
        ).toBe('Photo by Jane Doe on Unsplash');
    });

    it('builds escaped body insert HTML with credit under the image', () => {
        const html = buildUnsplashBodyInsertHtml({
            src: 'https://images.unsplash.com/photo?x=1&y=2',
            alt: 'Flag "red" & blue',
            credit: 'Photo by Jane <Doe> on Unsplash',
        });

        expect(html).toContain('src="https://images.unsplash.com/photo?x=1&amp;y=2"');
        expect(html).toContain('alt="Flag &quot;red&quot; &amp; blue"');
        expect(html).toContain('class="canvas-post-body-image"');
        expect(html).toContain('data-canvas-image-credit="true"');
        expect(html).toContain('class="canvas-post-body-image-credit"');
        expect(html).toContain('Photo by Jane &lt;Doe&gt; on Unsplash');
        expect(html.startsWith('<img ')).toBe(true);
        expect(html).toContain('</p>');
    });
});
