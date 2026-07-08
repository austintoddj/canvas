import { Avatar } from '@/components/avatar';
import { CommandPalette } from '@/components/CommandPalette';
import {
    Dropdown,
    DropdownButton,
    DropdownDivider,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownTrailingIcon,
    dropdownInsetItemClass,
    dropdownProfileItemClass,
} from '@/components/dropdown';
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '@/components/navbar';
import { KbdGroup } from '@/components/kbd';
import {
    Sidebar,
    SidebarBody,
    SidebarFooter,
    SidebarHeader,
    SidebarHeading,
    SidebarItem,
    SidebarLabel,
    SidebarSection,
    SidebarShortcut,
    SidebarSpacer,
} from '@/components/sidebar';
import { SidebarLayout } from '@/components/sidebar-layout';
import { useCanvas } from '@/hooks/useCanvas';
import { usePermissions } from '@/hooks/usePermissions';
import { useRecentPosts } from '@/hooks/useRecentPosts';
import { type ThemeMode, useTheme } from '@/hooks/useTheme';
import { searchShortcutKeys } from '@/lib/platform';
import { hostHomeUrl } from '@/lib/urls';
import {
    ArrowTopRightOnSquareIcon,
    BookOpenIcon,
    Cog6ToothIcon,
    ComputerDesktopIcon,
    DocumentTextIcon,
    HomeIcon,
    LifebuoyIcon,
    MagnifyingGlassIcon,
    MoonIcon,
    PhotoIcon,
    RectangleStackIcon,
    RocketLaunchIcon,
    SunIcon,
    TagIcon,
    UsersIcon,
} from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

function ThemeToggle({ mode, setMode }: { mode: ThemeMode; setMode: (m: ThemeMode) => void }) {
    const options: { value: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
        { value: 'system', label: 'System theme', Icon: ComputerDesktopIcon },
        { value: 'light', label: 'Light theme', Icon: SunIcon },
        { value: 'dark', label: 'Dark theme', Icon: MoonIcon },
    ];

    return (
        <div className="col-span-full flex items-center justify-between px-3.5 py-2 sm:px-3 sm:py-1.5">
            <span className="text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white">Theme</span>
            <div className="flex rounded-lg bg-zinc-950/5 p-0.5 dark:bg-white/10" role="group" aria-label="Theme">
                {options.map(({ value, label, Icon }) => (
                    <button
                        key={value}
                        type="button"
                        aria-label={label}
                        aria-pressed={mode === value}
                        title={label}
                        onClick={() => setMode(value)}
                        className={clsx(
                            'rounded-md p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 dark:focus-visible:ring-white/25',
                            mode === value
                                ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-white'
                                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                        )}
                    >
                        <Icon className="size-4" aria-hidden="true" />
                    </button>
                ))}
            </div>
        </div>
    );
}

function UserDropdownContent({ mode, setMode }: { mode: ThemeMode; setMode: (m: ThemeMode) => void }) {
    const { user, boot } = useCanvas();

    return (
        <>
            <DropdownItem href="/settings" className={dropdownProfileItemClass}>
                <Avatar src={user.avatar_url} className="size-8 shrink-0" square alt="" />
                <div className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                        {user.name}
                    </span>
                    <span className="block truncate text-xs/5 text-zinc-500 dark:text-zinc-400">{user.email}</span>
                </div>
                <DropdownTrailingIcon>
                    <Cog6ToothIcon />
                </DropdownTrailingIcon>
            </DropdownItem>

            <DropdownDivider />

            {/* Theme toggle — plain div so it doesn't close the menu */}
            <ThemeToggle mode={mode} setMode={setMode} />

            <DropdownItem
                href={hostHomeUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={dropdownInsetItemClass}
            >
                <DropdownLabel inset>Home Page</DropdownLabel>
                <DropdownTrailingIcon inset>
                    <ArrowTopRightOnSquareIcon />
                </DropdownTrailingIcon>
            </DropdownItem>
            <DropdownItem
                href="https://github.com/austintoddj/canvas/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className={dropdownInsetItemClass}
            >
                <DropdownLabel inset>Changelog</DropdownLabel>
                <DropdownTrailingIcon inset>
                    <RocketLaunchIcon />
                </DropdownTrailingIcon>
            </DropdownItem>
            <DropdownItem
                href="https://github.com/austintoddj/canvas/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className={dropdownInsetItemClass}
            >
                <DropdownLabel inset>Help</DropdownLabel>
                <DropdownTrailingIcon inset>
                    <LifebuoyIcon />
                </DropdownTrailingIcon>
            </DropdownItem>
            <DropdownItem
                href="https://github.com/austintoddj/canvas"
                target="_blank"
                rel="noopener noreferrer"
                className={dropdownInsetItemClass}
            >
                <DropdownLabel inset>Docs</DropdownLabel>
                <DropdownTrailingIcon inset>
                    <BookOpenIcon />
                </DropdownTrailingIcon>
            </DropdownItem>

            <DropdownDivider />

            <div className="col-span-full rounded-b-xl bg-zinc-50 px-3.5 py-2 dark:bg-zinc-800/50 sm:px-3">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Version {boot.version}</p>
            </div>
        </>
    );
}

export default function Layout() {
    const { user } = useCanvas();
    const { canManageTaxonomy, canManageUsers } = usePermissions();
    const { pathname } = useLocation();
    const { posts: recentPosts } = useRecentPosts(5);
    const { mode, setMode } = useTheme();
    const [paletteOpen, setPaletteOpen] = useState(false);

    const openPalette = useCallback(() => setPaletteOpen(true), []);
    const closePalette = useCallback(() => setPaletteOpen(false), []);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setPaletteOpen((prev) => !prev);
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <>
            <CommandPalette key={String(paletteOpen)} open={paletteOpen} onClose={closePalette} />

            <SidebarLayout
                navbar={
                    <Navbar>
                        <NavbarSpacer />
                        <NavbarSection>
                            <NavbarItem onClick={openPalette} aria-label="Search">
                                <MagnifyingGlassIcon />
                            </NavbarItem>
                            <Dropdown>
                                <DropdownButton as={NavbarItem}>
                                    <Avatar src={user.avatar_url} square />
                                </DropdownButton>
                                <DropdownMenu className="min-w-72" anchor="bottom end">
                                    <UserDropdownContent mode={mode} setMode={setMode} />
                                </DropdownMenu>
                            </Dropdown>
                        </NavbarSection>
                    </Navbar>
                }
                sidebar={
                    <Sidebar>
                        <SidebarHeader>
                            <SidebarItem className="lg:mb-2.5">
                                <Avatar
                                    initials="C"
                                    className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                    square
                                />
                                <SidebarLabel>Canvas</SidebarLabel>
                            </SidebarItem>
                            <SidebarSection className="max-lg:hidden">
                                <SidebarItem onClick={openPalette}>
                                    <MagnifyingGlassIcon />
                                    <SidebarLabel>Search</SidebarLabel>
                                    <SidebarShortcut>
                                        <KbdGroup keys={searchShortcutKeys()} />
                                    </SidebarShortcut>
                                </SidebarItem>
                            </SidebarSection>
                        </SidebarHeader>

                        <SidebarBody>
                            <SidebarSection>
                                <SidebarItem href="/" current={pathname === '/'}>
                                    <HomeIcon />
                                    <SidebarLabel>Dashboard</SidebarLabel>
                                </SidebarItem>
                                <SidebarItem href="/posts" current={pathname.startsWith('/posts')}>
                                    <DocumentTextIcon />
                                    <SidebarLabel>Posts</SidebarLabel>
                                </SidebarItem>
                                <SidebarItem href="/media" current={pathname.startsWith('/media')}>
                                    <PhotoIcon />
                                    <SidebarLabel>Media</SidebarLabel>
                                </SidebarItem>
                                {canManageTaxonomy ? (
                                    <>
                                        <SidebarItem href="/tags" current={pathname.startsWith('/tags')}>
                                            <TagIcon />
                                            <SidebarLabel>Tags</SidebarLabel>
                                        </SidebarItem>
                                        <SidebarItem href="/topics" current={pathname.startsWith('/topics')}>
                                            <RectangleStackIcon />
                                            <SidebarLabel>Topics</SidebarLabel>
                                        </SidebarItem>
                                    </>
                                ) : null}
                                {canManageUsers ? (
                                    <SidebarItem
                                        href="/settings/users"
                                        current={pathname.startsWith('/settings/users')}
                                    >
                                        <UsersIcon />
                                        <SidebarLabel>Users</SidebarLabel>
                                    </SidebarItem>
                                ) : null}
                            </SidebarSection>

                            {recentPosts.length > 0 && (
                                <SidebarSection className="max-lg:hidden">
                                    <SidebarHeading>Recent Posts</SidebarHeading>
                                    {recentPosts.map((post) => (
                                        <SidebarItem key={post.id} href={`/posts/${post.id}`}>
                                            {post.title ?? 'Untitled'}
                                        </SidebarItem>
                                    ))}
                                </SidebarSection>
                            )}

                            <SidebarSpacer />
                        </SidebarBody>

                        <SidebarFooter className="max-lg:hidden">
                            <Dropdown>
                                <DropdownButton as={SidebarItem}>
                                    <span className="flex min-w-0 items-center gap-3">
                                        <Avatar src={user.avatar_url} className="size-10" square alt="" />
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                                                {user.name}
                                            </span>
                                            <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                                                {user.email}
                                            </span>
                                        </span>
                                    </span>
                                </DropdownButton>
                                <DropdownMenu className="min-w-72" anchor="top start">
                                    <UserDropdownContent mode={mode} setMode={setMode} />
                                </DropdownMenu>
                            </Dropdown>
                        </SidebarFooter>
                    </Sidebar>
                }
            >
                <Outlet />
            </SidebarLayout>
        </>
    );
}
