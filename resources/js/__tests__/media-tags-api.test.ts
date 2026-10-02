import { describe, expect, it } from 'vitest';

import { ValidationError } from '@/lib/api';
import { collidingMediaTag, isMediaTagNameConflict, mediaTagNameTaken } from '@/lib/api/media-tags';

describe('media tag identity helpers', () => {
    it('detects a taken name case-insensitively and can ignore a row', () => {
        const tags = [
            { id: '1', name: 'Hero' },
            { id: '2', name: 'Homepage' },
        ];

        expect(mediaTagNameTaken('hero', tags)).toBe(true);
        expect(mediaTagNameTaken('  HERO  ', tags)).toBe(true);
        expect(mediaTagNameTaken('hero', tags, '1')).toBe(false);
        expect(mediaTagNameTaken('Landscape', tags)).toBe(false);
    });

    it('treats a 422 collision payload as a name conflict', () => {
        const error = new ValidationError({
            message: 'A tag with that name already exists.',
            errors: { name: ['A tag with that name already exists.'] },
            tag: { id: '3f2c', name: 'Hero' },
        });

        expect(collidingMediaTag(error)).toEqual({ id: '3f2c', name: 'Hero' });
        expect(isMediaTagNameConflict(error)).toBe(true);
        expect(isMediaTagNameConflict(new Error('nope'))).toBe(false);
    });
});
