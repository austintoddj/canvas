// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import { hostHomeUrl, hostOrigin } from '@/lib/urls';

describe('url helpers', () => {
    it('uses the current window origin for host links', () => {
        expect(hostOrigin()).toBe(window.location.origin);
        expect(hostHomeUrl()).toBe(window.location.origin);
    });
});
