import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import emptyStateSource from '@/components/EmptyState.tsx?raw';
import sideDrawerSource from '@/components/SideDrawer.tsx?raw';
import textSource from '@/components/text.tsx?raw';
import dashboardSource from '@/pages/Dashboard.tsx?raw';
import organizeSource from '@/pages/Organize/Index.tsx?raw';

const appCss = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../../css/app.css'),
    'utf8'
);

describe('canvas design tokens (app.css)', () => {
    it('defines semantic surface, text, danger, and motion tokens', () => {
        expect(appCss).toContain('--color-canvas-panel');
        expect(appCss).toContain('--color-canvas-panel-dark');
        expect(appCss).toContain('--color-canvas-border');
        expect(appCss).toContain('--color-canvas-muted');
        expect(appCss).toContain('--color-canvas-muted-dark');
        expect(appCss).toContain('--color-canvas-danger');
        expect(appCss).toContain('--color-canvas-danger-dark');
        expect(appCss).toContain('--color-canvas-focus');
        expect(appCss).toContain('--duration-canvas-content');
        expect(appCss).toContain('--duration-canvas-empty');
        expect(appCss).toContain('--ease-canvas-out');
    });
});

describe('typography primitives', () => {
    it('exports PageDescription and ErrorText on canvas tokens', () => {
        expect(textSource).toContain('export function PageDescription');
        expect(textSource).toContain('export function ErrorText');
        expect(textSource).toContain('data-slot="page-description"');
        expect(textSource).toContain('data-slot="error-text"');
        expect(textSource).toContain('text-canvas-muted');
        expect(textSource).toContain('text-canvas-danger');
        expect(textSource).toContain('dark:text-canvas-danger-dark');
    });
});

describe('app chrome adopts tokens', () => {
    it('uses PageDescription / ErrorText on primary list surfaces', () => {
        expect(dashboardSource).toContain('PageDescription');
        expect(dashboardSource).toContain('ErrorText');
        expect(organizeSource).toContain('PageDescription');
        expect(organizeSource).toContain('ErrorText');
    });

    it('tokenizes EmptyState and SideDrawer surfaces', () => {
        expect(emptyStateSource).toContain('border-canvas-border');
        expect(emptyStateSource).toContain('text-canvas-fg');
        expect(sideDrawerSource).toContain('bg-canvas-panel');
        expect(sideDrawerSource).toContain('dark:bg-canvas-panel-dark');
        expect(sideDrawerSource).toContain('border-canvas-border');
    });
});
