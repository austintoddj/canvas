import { describe, expect, it } from 'vitest';

import { makeBoot } from './boot';

describe('makeBoot', () => {
    it('merges translation overrides onto the default catalog', () => {
        const boot = makeBoot({
            translations: {
                'calendar.title': 'Calendar',
            },
        });
        const dictionary = JSON.parse(boot.translations) as Record<string, string>;

        expect(dictionary['common.close']).toBe('Close');
        expect(dictionary['calendar.title']).toBe('Calendar');
    });

    it('accepts a JSON string override the same way', () => {
        const boot = makeBoot({
            translations: JSON.stringify({ 'editor.publish': 'Go live' }),
        });
        const dictionary = JSON.parse(boot.translations) as Record<string, string>;

        expect(dictionary['editor.publish']).toBe('Go live');
        expect(dictionary['common.cancel']).toBe('Cancel');
    });
});
