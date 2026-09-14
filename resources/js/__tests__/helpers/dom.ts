import { vi } from 'vitest';

export function stubMatchMedia(matches: (query: string) => boolean): void {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: matches(query),
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
}

export function matchMediaReducedMotion(query: string): boolean {
    return query.includes('prefers-reduced-motion');
}

export function matchMediaFinePointerHover(query: string): boolean {
    return query.includes('hover') && query.includes('pointer: fine');
}
