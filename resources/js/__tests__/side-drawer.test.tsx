// @vitest-environment happy-dom

import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { SideDrawer } from '@/components/SideDrawer';

function mockScrollMetrics(
    el: HTMLElement,
    { scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number }
) {
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
}

function SaveHarness() {
    const [tick, setTick] = useState(0);

    return (
        <SideDrawer
            open
            onClose={() => undefined}
            title="Drawer"
            footer={
                <button type="button" onClick={() => setTick((value) => value + 1)}>
                    Save {tick}
                </button>
            }
        >
            <div style={{ height: 2000 }} data-drawer-body="true">
                Tall content {tick}
            </div>
        </SideDrawer>
    );
}

describe('SideDrawer scroll position', () => {
    it('restores body scroll after a re-render while open', () => {
        render(<SaveHarness />);

        const body = document.querySelector('[data-side-drawer-scroll="true"]') as HTMLElement | null;
        expect(body).not.toBeNull();
        mockScrollMetrics(body!, { scrollHeight: 2000, clientHeight: 400 });

        act(() => {
            body!.scrollTop = 900;
            body!.dispatchEvent(new Event('scroll', { bubbles: true }));
        });
        expect(body!.scrollTop).toBe(900);

        // Simulate a save-driven update that zeros scroll (focus/layout clamp).
        act(() => {
            body!.scrollTop = 0;
            screen.getByRole('button', { name: /Save 0/ }).click();
        });

        expect(body!.scrollTop).toBe(900);
        expect(screen.getByText('Tall content 1')).toBeInTheDocument();
    });
});
