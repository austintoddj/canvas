import { AnimatedOutlet } from '@/components/AnimatedOutlet';
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
import { Toaster } from '@/components/Toaster';
import { UserDetailDrawer } from '@/components/users/UserDetailDrawer';
import { useCanvas } from '@/hooks/useCanvas';
import { usePermissions } from '@/hooks/usePermissions';
import { useRecentPosts } from '@/hooks/useRecentPosts';
import { type ThemeMode, useTheme } from '@/hooks/useTheme';
import { searchShortcutKeys } from '@/lib/platform';
import { hostHomeUrl } from '@/lib/urls';
import {
    ArrowTopRightOnSquareIcon,
    BookOpenIcon,
    BuildingStorefrontIcon,
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
    UsersIcon,
} from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function ThemeToggle({ mode, setMode }: { mode: ThemeMode; setMode: (m: ThemeMode) => void }) {
    const { t } = useCanvas();
    const options: { value: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
        { value: 'system', label: t('nav.theme_system'), Icon: ComputerDesktopIcon },
        { value: 'light', label: t('nav.theme_light'), Icon: SunIcon },
        { value: 'dark', label: t('nav.theme_dark'), Icon: MoonIcon },
    ];

    return (
        <div className="col-span-full flex items-center justify-between px-3.5 py-2 sm:px-3 sm:py-1.5">
            <span className="text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white">{t('nav.theme')}</span>
            <div
                className="flex rounded-lg bg-zinc-950/5 p-0.5 dark:bg-white/[0.06] dark:ring-1 dark:ring-white/5"
                role="group"
                aria-label={t('nav.theme')}
            >
                {options.map(({ value, label, Icon }) => (
                    <button
                        key={value}
                        type="button"
                        aria-label={label}
                        aria-pressed={mode === value}
                        title={label}
                        onClick={() => setMode(value)}
                        className={clsx(
                            'rounded-md p-1.5 transition-colors focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                            mode === value
                                ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white dark:ring-1 dark:ring-white/10'
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

function UserDropdownContent({
    mode,
    setMode,
    onOpenProfile,
}: {
    mode: ThemeMode;
    setMode: (m: ThemeMode) => void;
    onOpenProfile: () => void;
}) {
    const { user, boot, t } = useCanvas();

    return (
        <>
            <DropdownItem onClick={onOpenProfile} className={dropdownProfileItemClass}>
                <Avatar src={user.avatar_url} className="size-8 shrink-0" square alt="" />
                <div className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                        {user.name}
                    </span>
                    <span className="block truncate text-xs/5 text-canvas-muted dark:text-canvas-muted-dark">
                        {user.email}
                    </span>
                </div>
            </DropdownItem>

            <DropdownDivider />

            <ThemeToggle mode={mode} setMode={setMode} />

            <DropdownItem
                href={hostHomeUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={dropdownInsetItemClass}
            >
                <DropdownLabel inset>{t('nav.home_page')}</DropdownLabel>
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
                <DropdownLabel inset>{t('nav.changelog')}</DropdownLabel>
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
                <DropdownLabel inset>{t('nav.help')}</DropdownLabel>
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
                <DropdownLabel inset>{t('nav.docs')}</DropdownLabel>
                <DropdownTrailingIcon inset>
                    <BookOpenIcon />
                </DropdownTrailingIcon>
            </DropdownItem>

            <DropdownDivider />

            <div className="col-span-full rounded-b-xl bg-zinc-50 px-3.5 py-2 dark:bg-white/[0.03] sm:px-3">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {t('common.version', { version: boot.version })}
                </p>
            </div>
        </>
    );
}

export default function Layout() {
    const { user, t } = useCanvas();
    const { canManageTaxonomy, canManageUsers, canManageSettings } = usePermissions();
    const { pathname } = useLocation();
    const { posts: recentPosts } = useRecentPosts(5);
    const { mode, setMode } = useTheme();
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const openPalette = useCallback(() => setPaletteOpen(true), []);
    const closePalette = useCallback(() => setPaletteOpen(false), []);
    const openProfile = useCallback(() => setProfileOpen(true), []);
    const closeProfile = useCallback(() => setProfileOpen(false), []);

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
            <Toaster />
            <UserDetailDrawer open={profileOpen} userId={profileOpen ? String(user.id) : null} onClose={closeProfile} />

            <SidebarLayout
                navbar={
                    <Navbar>
                        <NavbarSpacer />
                        <NavbarSection>
                            <NavbarItem onClick={openPalette} aria-label={t('nav.search')}>
                                <MagnifyingGlassIcon />
                            </NavbarItem>
                            <Dropdown>
                                <DropdownButton as={NavbarItem}>
                                    <Avatar src={user.avatar_url} square />
                                </DropdownButton>
                                <DropdownMenu className="min-w-72" anchor="bottom end">
                                    <UserDropdownContent mode={mode} setMode={setMode} onOpenProfile={openProfile} />
                                </DropdownMenu>
                            </Dropdown>
                        </NavbarSection>
                    </Navbar>
                }
                sidebar={
                    <Sidebar>
                        <SidebarHeader>
                            <SidebarItem href="/" className="lg:mb-2.5">
                                <Avatar
                                    initials="C"
                                    className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                    square
                                />
                                <SidebarLabel>{t('nav.canvas')}</SidebarLabel>
                            </SidebarItem>
                            <SidebarSection className="max-lg:hidden">
                                <SidebarItem onClick={openPalette}>
                                    <MagnifyingGlassIcon />
                                    <SidebarLabel>{t('nav.search')}</SidebarLabel>
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
                                    <SidebarLabel>{t('nav.dashboard')}</SidebarLabel>
                                </SidebarItem>
                                <SidebarItem href="/posts" current={pathname.startsWith('/posts')}>
                                    <DocumentTextIcon />
                                    <SidebarLabel>{t('nav.posts')}</SidebarLabel>
                                </SidebarItem>
                                <SidebarItem href="/media" current={pathname.startsWith('/media')}>
                                    <PhotoIcon />
                                    <SidebarLabel>{t('nav.media')}</SidebarLabel>
                                </SidebarItem>
                                {canManageTaxonomy ? (
                                    <SidebarItem
                                        href="/organize"
                                        current={
                                            pathname.startsWith('/organize') ||
                                            pathname.startsWith('/tags') ||
                                            pathname.startsWith('/topics')
                                        }
                                    >
                                        <RectangleStackIcon />
                                        <SidebarLabel>{t('nav.organize')}</SidebarLabel>
                                    </SidebarItem>
                                ) : null}
                                {canManageUsers ? (
                                    <SidebarItem
                                        href="/settings/users"
                                        current={pathname.startsWith('/settings/users')}
                                    >
                                        <UsersIcon />
                                        <SidebarLabel>{t('nav.users')}</SidebarLabel>
                                    </SidebarItem>
                                ) : null}
                                {canManageSettings ? (
                                    <SidebarItem
                                        href="/settings/integrations"
                                        current={pathname.startsWith('/settings/integrations')}
                                    >
                                        <BuildingStorefrontIcon />
                                        <SidebarLabel>{t('nav.integrations')}</SidebarLabel>
                                    </SidebarItem>
                                ) : null}
                            </SidebarSection>

                            {recentPosts.length > 0 && (
                                <SidebarSection className="max-lg:hidden">
                                    <SidebarHeading>{t('nav.recent_posts')}</SidebarHeading>
                                    {recentPosts.map((post) => (
                                        <SidebarItem key={post.id} href={`/posts/${post.id}`}>
                                            {post.title ?? t('common.untitled')}
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
                                            <span className="block truncate text-xs/5 font-normal text-canvas-muted dark:text-canvas-muted-dark">
                                                {user.email}
                                            </span>
                                        </span>
                                    </span>
                                </DropdownButton>
                                <DropdownMenu className="min-w-72" anchor="top start">
                                    <UserDropdownContent mode={mode} setMode={setMode} onOpenProfile={openProfile} />
                                </DropdownMenu>
                            </Dropdown>
                        </SidebarFooter>
                    </Sidebar>
                }
            >
                <AnimatedOutlet />
            </SidebarLayout>
        </>
    );
}
