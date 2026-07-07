// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import { hostHomeUrl, hostOrigin } from '@/lib/urls';

describe('hostOrigin', () => {
    it('returns window.location.origin', () => {
        expect(hostOrigin()).toBe(window.location.origin);
        expect(hostHomeUrl()).toBe(window.location.origin);
    });
});