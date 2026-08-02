// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, Link } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import { AnimatedOutlet } from '@/components/AnimatedOutlet';

afterEach(() => {
    cleanup();
});

describe('AnimatedOutlet scroll-to-top', () => {
    beforeEach(() => {
        window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    });

    it('scrolls the window to the top when the pathname changes', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route
                        element={
                            <div>
                                <AnimatedOutlet />
                            </div>
                        }
                    >
                        <Route
                            path="/"
                            element={
                                <div>
                                    <p>Dashboard</p>
                                    <Link to="/posts/1/stats">Open stats</Link>
                                </div>
                            }
                        />
                        <Route path="/posts/1/stats" element={<p>Post stats</p>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
        vi.mocked(window.scrollTo).mockClear();

        await user.click(screen.getByRole('link', { name: 'Open stats' }));

        expect(screen.getByText('Post stats')).toBeInTheDocument();
        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });
});
