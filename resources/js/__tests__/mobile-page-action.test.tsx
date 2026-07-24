// @vitest-environment happy-dom

import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { Navbar, NavbarItem, NavbarSection } from '@/components/navbar';
import { PageHeader } from '@/components/PageHeader';
import { MobilePageActionProvider, useMobilePageActionState } from '@/contexts/MobilePageActionContext';
import { useMobilePageAction } from '@/hooks/useMobilePageAction';
import { mobilePageActionKindForPath } from '@/lib/mobile-page-action';
import { resolveMobilePageAction } from '@/lib/resolve-mobile-page-action';

afterEach(() => {
    cleanup();
});

function t(key: string, replacementsOrFallback?: string | Record<string, string | number>, fallback?: string): string {
    const map: Record<string, string> = {
        'posts.new': 'New post',
        'media.upload': 'Upload media',
        'organize.new_topic': 'New topic',
        'users.invite': 'Invite',
    };

    if (typeof replacementsOrFallback === 'string') {
        return map[key] ?? replacementsOrFallback;
    }

    return map[key] ?? fallback ?? key;
}

function MobileNavbarAction() {
    const { pathname } = useLocation();
    const { contribution } = useMobilePageActionState();
    const action = resolveMobilePageAction({
        pathname,
        t,
        contribution,
        canManageTaxonomy: true,
        canManageUsers: true,
    });

    if (action === null) {
        return null;
    }

    if (typeof action.href === 'string') {
        return (
            <NavbarItem href={action.href} aria-label={action.label} data-mobile-page-action="true">
                {action.icon}
            </NavbarItem>
        );
    }

    return (
        <NavbarItem
            type="button"
            aria-label={action.label}
            disabled={action.disabled}
            data-mobile-page-action="true"
            onClick={action.onClick}
        >
            {action.icon}
        </NavbarItem>
    );
}

function PageWithContribution(props: {
    visible?: boolean;
    label?: string;
    onClick?: () => void;
    disabled?: boolean;
    headerLabel?: string;
}) {
    useMobilePageAction({
        visible: props.visible,
        label: props.label,
        onClick: props.onClick,
        disabled: props.disabled,
    });

    return (
        <PageHeader
            title="Posts"
            actions={
                props.visible === false ? undefined : (
                    <button type="button" data-testid="desktop-action">
                        {props.headerLabel ?? 'New post'}
                    </button>
                )
            }
        />
    );
}

function Harness({ path = '/posts', page }: { path?: string; page?: React.ReactNode }) {
    return (
        <MemoryRouter initialEntries={[path]}>
            <MobilePageActionProvider>
                <Navbar>
                    <NavbarSection>
                        <MobileNavbarAction />
                    </NavbarSection>
                </Navbar>
                {page}
            </MobilePageActionProvider>
        </MemoryRouter>
    );
}

function mobileAction() {
    return document.querySelector('[data-mobile-page-action="true"]');
}

describe('mobilePageActionKindForPath', () => {
    it('maps list routes and ignores nested editors', () => {
        expect(mobilePageActionKindForPath('/')).toBe('new-post');
        expect(mobilePageActionKindForPath('/posts')).toBe('new-post');
        expect(mobilePageActionKindForPath('/posts/new')).toBeNull();
        expect(mobilePageActionKindForPath('/media')).toBe('upload');
        expect(mobilePageActionKindForPath('/media/abc')).toBeNull();
        expect(mobilePageActionKindForPath('/organize')).toBe('new-taxonomy');
        expect(mobilePageActionKindForPath('/users')).toBe('invite');
        expect(mobilePageActionKindForPath('/integrations')).toBeNull();
    });
});

describe('resolveMobilePageAction', () => {
    it('shows the route default before any page contribution', () => {
        const action = resolveMobilePageAction({
            pathname: '/posts',
            t,
            contribution: {},
        });

        expect(action).toMatchObject({ label: 'New post', href: '/posts/new' });
    });

    it('hides when the page suppresses for an empty state', () => {
        expect(
            resolveMobilePageAction({
                pathname: '/posts',
                t,
                contribution: { visible: false },
            })
        ).toBeNull();
    });

    it('merges handlers for button actions', () => {
        const onClick = vi.fn();
        const action = resolveMobilePageAction({
            pathname: '/media',
            t,
            contribution: { onClick, disabled: true, label: 'Uploading…' },
        });

        expect(action).toMatchObject({ label: 'Uploading…', disabled: true });
        action?.onClick?.();
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

describe('mobile page action chrome', () => {
    it('renders from the route alone so chrome is present before the page mounts', () => {
        render(<Harness path="/posts" />);

        const mobile = mobileAction();
        expect(mobile).not.toBeNull();
        expect(mobile).toHaveAttribute('href', '/posts/new');
        expect(mobile).toHaveAttribute('aria-label', 'New post');
    });

    it('keeps header actions desktop-only when the page contributes', () => {
        render(<Harness path="/posts" page={<PageWithContribution visible headerLabel="New post" />} />);

        expect(screen.getByTestId('desktop-action').parentElement).toHaveClass('hidden', 'lg:flex');
    });

    it('hides the navbar control when the page marks the empty state', () => {
        render(<Harness path="/posts" page={<PageWithContribution visible={false} />} />);

        expect(mobileAction()).toBeNull();
        expect(screen.queryByTestId('desktop-action')).not.toBeInTheDocument();
    });

    it('invokes the latest onClick handler from the navbar control', async () => {
        const user = userEvent.setup();
        const first = vi.fn();
        const second = vi.fn();
        const { rerender } = render(
            <Harness path="/media" page={<PageWithContribution onClick={first} label="Upload" />} />
        );

        await user.click(mobileAction()!);
        expect(first).toHaveBeenCalledTimes(1);

        rerender(<Harness path="/media" page={<PageWithContribution onClick={second} label="Upload" />} />);

        await user.click(mobileAction()!);
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('forwards disabled state to the navbar button', () => {
        render(
            <Harness
                path="/media"
                page={<PageWithContribution onClick={() => undefined} label="Creating…" disabled />}
            />
        );

        expect(mobileAction()).toBeDisabled();
    });

    it('switches route defaults without waiting on the previous page', () => {
        function Switcher() {
            const { pathname } = useLocation();

            return (
                <MobilePageActionProvider>
                    <Navbar>
                        <NavbarSection>
                            <MobileNavbarAction />
                        </NavbarSection>
                    </Navbar>
                    <div data-testid="path">{pathname}</div>
                </MobilePageActionProvider>
            );
        }

        render(
            <MemoryRouter initialEntries={['/posts']}>
                <Routes>
                    <Route path="*" element={<Switcher />} />
                </Routes>
            </MemoryRouter>
        );

        expect(mobileAction()).toHaveAttribute('href', '/posts/new');
    });

    it('throws outside the provider', () => {
        function Orphan() {
            useMobilePageAction({ visible: true });

            return null;
        }

        expect(() => {
            act(() => {
                render(<Orphan />);
            });
        }).toThrow(/MobilePageActionProvider/);
    });
});
