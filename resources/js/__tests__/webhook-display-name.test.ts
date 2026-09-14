import { describe, expect, it } from 'vitest';

import { webhookDisplayName } from '@/lib/integrations/webhook-display-name';

describe('webhookDisplayName', () => {
    it('uses the URL hostname', () => {
        expect(webhookDisplayName('https://hooks.example.com/canvas')).toBe('hooks.example.com');
        expect(webhookDisplayName('http://localhost:8080/hooks')).toBe('localhost');
    });

    it('falls back when the host is missing', () => {
        expect(webhookDisplayName('file:///hooks/canvas')).toBe('file:///hooks/canvas');
    });

    it('truncates a long URL that has no host', () => {
        const url = `file:///${'a'.repeat(80)}`;

        expect(webhookDisplayName(url)).toBe(`${url.slice(0, 47)}…`);
        expect(webhookDisplayName(url).length).toBe(48);
    });

    it('truncates an invalid URL', () => {
        expect(webhookDisplayName('not a url')).toBe('not a url');

        const long = `not-a-url/${'x'.repeat(80)}`;
        expect(webhookDisplayName(long)).toBe(`${long.slice(0, 47)}…`);
    });

    it('returns an empty string for blank values', () => {
        expect(webhookDisplayName(null)).toBe('');
        expect(webhookDisplayName(undefined)).toBe('');
        expect(webhookDisplayName('   ')).toBe('');
    });
});
