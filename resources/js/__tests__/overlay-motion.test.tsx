// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { Alert, AlertTitle } from '@/components/alert';
import { Dialog, DialogTitle } from '@/components/dialog';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { SidebarLayout } from '@/components/sidebar-layout';
import { SideDrawer } from '@/components/SideDrawer';
import { renderWithCanvas } from '@/__tests__/helpers/render';
import { loadTranslations } from '@/lib/i18n';

function classesOf(element: Element): string[] {
    return element.className.split(/\s+/);
}

function domRect(left: number, width: number): DOMRect {
    return {
        x: left,
        y: 0,
        left,
        top: 0,
        right: left + width,
        bottom: 32,
        width,
        height: 32,
        toJSON() {
            return {};
        },
    } as DOMRect;
}

describe('overlay motion', () => {
    const originalRect = Element.prototype.getBoundingClientRect;

    afterEach(() => {
        Element.prototype.getBoundingClientRect = originalRect;
    });

    it('slides dialogs and alerts on the phone and scales them slightly from sm', () => {
        const { unmount } = render(
            <Dialog open onClose={() => undefined}>
                <DialogTitle>Publish</DialogTitle>
            </Dialog>
        );

        const panels = [
            document.querySelector('[id^="headlessui-dialog-panel-"]'),
        ];

        unmount();

        render(
            <Alert open onClose={() => undefined}>
                <AlertTitle>Delete post?</AlertTitle>
            </Alert>
        );

        panels.push(document.querySelector('[id^="headlessui-dialog-panel-"]'));

        for (const panel of panels) {
            expect(panel).not.toBeNull();

            const classes = classesOf(panel!);

            expect(classes).toContain('duration-[180ms]');
            expect(classes).toContain('sm:duration-[160ms]');
            expect(classes).toContain('ease-out');
            expect(classes).toContain('data-closed:translate-y-12');
            expect(classes).toContain('sm:data-closed:translate-y-0');
            expect(classes).toContain('sm:data-closed:scale-[0.98]');
            expect(classes).not.toContain('data-closed:scale-[0.98]');
            expect(classes).not.toContain('scale-95');
            expect(classes).toContain('motion-reduce:transition-opacity');
            expect(classes).toContain('motion-reduce:data-closed:translate-y-0');
            expect(classes).toContain('motion-reduce:data-closed:scale-100');
        }
    });

    it('moves both drawers in 200ms and drops the travel when motion is reduced', () => {
        render(
            <SideDrawer open onClose={() => undefined} title="Settings">
                <p>Body</p>
            </SideDrawer>
        );

        const panel = classesOf(document.querySelector('[id^="headlessui-dialog-panel-"]')!);

        expect(panel).toContain('duration-200');
        expect(panel).toContain('ease-out');
        expect(panel).toContain('data-closed:translate-x-full');
        expect(panel).toContain('motion-reduce:data-closed:translate-x-0');
        expect(panel).toContain('motion-reduce:transition-opacity');
        expect(panel).not.toContain('duration-300');
        expect(panel).not.toContain('ease-in-out');
    });

    it('matches the phone nav drawer to the side drawer and leaves the desktop rail at 300ms', async () => {
        const user = userEvent.setup();

        loadTranslations(JSON.stringify({ 'common.open_navigation': 'Open navigation' }));

        renderWithCanvas(
            <SidebarLayout navbar={<span>Search</span>} sidebar={<span>Nav</span>}>
                <p>Page</p>
            </SidebarLayout>
        );

        const rail = [...document.querySelectorAll('div')].find((element) =>
            element.className.includes('transition-[width]')
        );

        expect(rail?.className).toContain('duration-300');

        await user.click(screen.getByRole('button', { name: 'Open navigation' }));

        const drawer = classesOf(document.querySelector('[id^="headlessui-dialog-panel-"]')!);

        expect(drawer).toContain('max-w-80');
        expect(drawer).toContain('duration-200');
        expect(drawer).toContain('ease-out');
        expect(drawer).toContain('data-closed:-translate-x-full');
        expect(drawer).toContain('motion-reduce:data-closed:translate-x-0');
        expect(drawer).toContain('motion-reduce:transition-opacity');
        expect(drawer).not.toContain('duration-300');
    });

    it('eases the default pill indicator over 200ms and keeps the publish-panel ease', async () => {
        const user = userEvent.setup();

        Element.prototype.getBoundingClientRect = function (this: Element) {
            const role = this.getAttribute('role');

            if (role === 'radiogroup') {
                return domRect(0, 200);
            }

            if (role === 'radio') {
                const radios = [...(this.parentElement?.querySelectorAll('[role="radio"]') ?? [])];
                const index = Math.max(0, radios.indexOf(this));

                return domRect(index * 100, 100);
            }

            return originalRect.call(this);
        };

        const { rerender } = render(
            <PillNav value="one" onChange={() => undefined} indicator="slide" aria-label="Scope">
                <PillNavItem value="one">One</PillNavItem>
                <PillNavItem value="two">Two</PillNavItem>
            </PillNav>
        );

        await user.click(screen.getByRole('radio', { name: 'Two' }));

        rerender(
            <PillNav value="two" onChange={() => undefined} indicator="slide" aria-label="Scope">
                <PillNavItem value="one">One</PillNavItem>
                <PillNavItem value="two">Two</PillNavItem>
            </PillNav>
        );

        const indicator = document.querySelector('[role="radiogroup"] > [aria-hidden="true"]') as HTMLElement | null;

        expect(indicator?.style.transition).toContain('200ms');
        expect(indicator?.style.transition).toContain('cubic-bezier(0.22, 1, 0.36, 1)');
        expect(indicator?.style.transition).not.toContain('450ms');
        expect(indicator?.style.transition).not.toContain('1.2');

        rerender(
            <PillNav value="one" onChange={() => undefined} indicator="slide" slideMotion="ease" aria-label="When">
                <PillNavItem value="one">Now</PillNavItem>
                <PillNavItem value="two">Later</PillNavItem>
            </PillNav>
        );

        await user.click(screen.getByRole('radio', { name: 'Later' }));

        rerender(
            <PillNav value="two" onChange={() => undefined} indicator="slide" slideMotion="ease" aria-label="When">
                <PillNavItem value="one">Now</PillNavItem>
                <PillNavItem value="two">Later</PillNavItem>
            </PillNav>
        );

        const eased = document.querySelector('[role="radiogroup"] > [aria-hidden="true"]') as HTMLElement | null;

        expect(eased?.style.transition).toContain('280ms');
        expect(eased?.style.transition).toContain('cubic-bezier(0.2, 0, 0, 1)');
    });
});
