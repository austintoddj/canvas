// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import { SidebarLayout } from '@/components/sidebar-layout';
import { renderWithCanvas } from '@/__tests__/helpers/render';

function wellClassNames(editorInset = false): string[] {
    renderWithCanvas(
        <SidebarLayout navbar={<span>Search</span>} sidebar={<span>Nav</span>} editorInset={editorInset}>
            <p>Page</p>
        </SidebarLayout>
    );

    const well = document.querySelector('main > div');

    return well?.className.split(/\s+/) ?? [];
}

describe('SidebarLayout content well', () => {
    it('drops the desktop card shadow and keeps the phone page flat', () => {
        const classes = wellClassNames();

        expect(classes).toContain('p-6');
        expect(classes).toContain('lg:p-10');
        expect(classes).toContain('lg:ring-1');
        expect(classes).toContain('lg:ring-zinc-950/5');
        expect(classes).not.toContain('lg:shadow-xs');
        expect(classes).not.toContain('dark:lg:ring-white/10');
        expect(classes).not.toContain('shadow-xs');
    });

    it('uses the tighter desktop inset on the post editor', () => {
        const classes = wellClassNames(true);

        expect(classes).toContain('p-6');
        expect(classes).toContain('lg:p-6');
        expect(classes).not.toContain('lg:p-10');
    });
});
