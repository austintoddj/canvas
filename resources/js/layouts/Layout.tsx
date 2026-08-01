import { AnimatedOutlet } from '@/components/AnimatedOutlet';
import { Avatar } from '@/components/avatar';
import { CommandPalette } from '@/components/CommandPalette';
import { QuillIcon } from '@/components/QuillIcon';
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
import { Link } from '@/components/link';
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
import { CloseMenuIcon, SidebarLayout } from '@/components/sidebar-layout';
import { Toaster } from '@/components/Toaster';
import {
    NavIconCalendar,
    NavIconDashboard,
    NavIconIntegrations,
    NavIconMedia,
    NavIconOrganize,
    NavIconPosts,
    NavIconSearch,
    NavIconUsers,
} from '@/components/sidebar-nav-icons';
import { Tooltip } from '@/components/tooltip';
import { UserDetailDrawer } from '@/components/users/UserDetailDrawer';
import { MobilePageActionProvider, useMobilePageActionState } from '@/contexts/MobilePageActionContext';
import { SidebarChromeProvider, useSidebarChrome } from '@/contexts/SidebarChromeContext';
import { useCanvas } from '@/hooks/useCanvas';
import { usePermissions } from '@/hooks/usePermissions';
import { useRecentPosts } from '@/hooks/useRecentPosts';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { type ThemeMode, useTheme } from '@/hooks/useTheme';
import { resolveMobilePageAction } from '@/lib/resolve-mobile-page-action';
import { searchShortcutKeys } from '@/lib/platform';
import { hostHomeUrl } from '@/lib/urls';
import { userInitials } from '@/lib/users/roles';
import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    IconBook,
    IconDeviceDesktop,
    IconExternalLink,
    IconLayoutSidebarLeftCollapse,
    IconLayoutSidebarLeftExpand,
    IconLifebuoy,
    IconMoon,
    IconRocket,
    IconSearch,
    IconSun,
} from '@tabler/icons-react';

function ThemeToggle({ mode, setMode }: { mode: ThemeMode; setMode: (m: ThemeMode) => void }) {
    const { t } = useCanvas();
    const options: { value: ThemeMode; label: string; Icon: typeof IconSun }[] = [
        { value: 'system', label: t('nav.theme_system'), Icon: IconDeviceDesktop },
        { value: 'light', label: t('nav.theme_light'), Icon: IconSun },
        { value: 'dark', label: t('nav.theme_dark'), Icon: IconMoon },
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
                <Avatar
                    src={user.avatar_url}
                    initials={userInitials(user.name)}
                    className="size-8 shrink-0"
                    square
                    alt=""
                />
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
                    <IconExternalLink />
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
                    <IconRocket />
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
                    <IconLifebuoy />
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
                    <IconBook />
                </DropdownTrailingIcon>
            </DropdownItem>

            <DropdownDivider />

            <div className="col-span-full px-3.5 py-2 sm:px-3">
                <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                    <QuillIcon className="size-3.5 shrink-0" />
                    {t('common.version', { version: boot.version })}
                </p>
            </div>
        </>
    );
}

function SidebarCollapseToggle({ mode }: { mode: 'collapse' | 'expand' }) {
    const { t } = useCanvas();
    const { toggleCollapsed } = useSidebarChrome();
    const label = mode === 'expand' ? t('nav.expand_sidebar') : t('nav.collapse_sidebar');
    const tip = mode === 'expand' ? t('nav.expand') : t('nav.collapse');
    const Icon = mode === 'expand' ? IconLayoutSidebarLeftExpand : IconLayoutSidebarLeftCollapse;

    // Match SidebarItem rail chrome: size-9 hit target, size-5 icon, centered in the column.
    return (
        <Tooltip
            content={tip}
            placement="right"
            triggerClassName={mode === 'expand' ? 'flex w-full justify-center' : undefined}
        >
            <button
                type="button"
                onClick={toggleCollapsed}
                aria-label={label}
                aria-expanded={mode === 'collapse'}
                className={clsx(
                    'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500',
                    'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                    'hover:bg-zinc-950/5 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white'
                )}
            >
                <Icon data-slot="icon" className="size-5 shrink-0" stroke={1.85} aria-hidden />
            </button>
        </Tooltip>
    );
}

function AppSidebar({
    openPalette,
    mode,
    setMode,
    onOpenProfile,
}: {
    openPalette: () => void;
    mode: ThemeMode;
    setMode: (m: ThemeMode) => void;
    onOpenProfile: () => void;
}) {
    const { user, t } = useCanvas();
    const { canManageTaxonomy, canManageUsers, canManageIntegrations } = usePermissions();
    const { pathname } = useLocation();
    const { posts: recentPosts } = useRecentPosts(5);
    const { rail } = useSidebarChrome();

    return (
        <Sidebar>
            <SidebarHeader>
                <div className={clsx('flex items-center lg:mb-2.5', rail ? 'justify-center' : 'gap-2')}>
                    <Headless.CloseButton
                        as={Link}
                        href="/"
                        className={clsx(
                            'inline-flex max-w-full items-center rounded-lg text-left text-base/6 font-medium text-zinc-950 focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500 sm:text-sm/5 dark:text-white',
                            rail ? 'size-9 justify-center p-0' : 'gap-3 px-2 py-2.5 sm:py-2'
                        )}
                    >
                        <span
                            data-slot="avatar"
                            className={clsx(
                                'inline-grid shrink-0 place-items-center rounded-[20%] bg-zinc-900 text-white outline -outline-offset-1 outline-black/10 dark:bg-white dark:text-zinc-900 dark:outline-white/10',
                                rail ? 'size-7' : 'size-7 sm:size-6'
                            )}
                            aria-hidden
                        >
                            <QuillIcon className="size-[65%]" />
                        </span>
                        <SidebarLabel>{t('nav.canvas')}</SidebarLabel>
                    </Headless.CloseButton>

                    {/* Expanded desktop: collapse control top-right */}
                    {!rail ? (
                        <div className="ml-auto max-lg:hidden">
                            <SidebarCollapseToggle mode="collapse" />
                        </div>
                    ) : null}

                    {/* Mobile drawer close */}
                    <Headless.CloseButton
                        aria-label={t('common.close')}
                        className="-mr-1.5 ml-auto flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500 lg:hidden dark:text-zinc-400"
                    >
                        <CloseMenuIcon className="size-6" />
                    </Headless.CloseButton>
                </div>
                <SidebarSection className="max-lg:hidden">
                    <SidebarItem onClick={openPalette} tooltip={t('nav.search')}>
                        <NavIconSearch />
                        <SidebarLabel>{t('nav.search')}</SidebarLabel>
                        <SidebarShortcut>
                            <KbdGroup keys={searchShortcutKeys()} />
                        </SidebarShortcut>
                    </SidebarItem>
                </SidebarSection>
            </SidebarHeader>

            <SidebarBody>
                <SidebarSection>
                    <SidebarItem href="/" current={pathname === '/'} tooltip={t('nav.dashboard')}>
                        <NavIconDashboard />
                        <SidebarLabel>{t('nav.dashboard')}</SidebarLabel>
                    </SidebarItem>
                    <SidebarItem href="/posts" current={pathname.startsWith('/posts')} tooltip={t('nav.posts')}>
                        <NavIconPosts />
                        <SidebarLabel>{t('nav.posts')}</SidebarLabel>
                    </SidebarItem>
                    <SidebarItem
                        href="/calendar"
                        current={pathname.startsWith('/calendar')}
                        tooltip={t('nav.calendar')}
                    >
                        <NavIconCalendar />
                        <SidebarLabel>{t('nav.calendar')}</SidebarLabel>
                    </SidebarItem>
                    <SidebarItem href="/media" current={pathname.startsWith('/media')} tooltip={t('nav.media')}>
                        <NavIconMedia />
                        <SidebarLabel>{t('nav.media')}</SidebarLabel>
                    </SidebarItem>
                    {canManageTaxonomy ? (
                        <SidebarItem
                            href="/organize"
                            current={pathname.startsWith('/organize')}
                            tooltip={t('nav.organize')}
                        >
                            <NavIconOrganize />
                            <SidebarLabel>{t('nav.organize')}</SidebarLabel>
                        </SidebarItem>
                    ) : null}
                    {canManageUsers ? (
                        <SidebarItem href="/users" current={pathname.startsWith('/users')} tooltip={t('nav.users')}>
                            <NavIconUsers />
                            <SidebarLabel>{t('nav.users')}</SidebarLabel>
                        </SidebarItem>
                    ) : null}
                    {canManageIntegrations ? (
                        <SidebarItem
                            href="/integrations"
                            current={pathname.startsWith('/integrations')}
                            tooltip={t('nav.integrations')}
                        >
                            <NavIconIntegrations />
                            <SidebarLabel>{t('nav.integrations')}</SidebarLabel>
                        </SidebarItem>
                    ) : null}
                </SidebarSection>

                {!rail && recentPosts.length > 0 ? (
                    <SidebarSection className="max-lg:hidden">
                        <SidebarHeading>{t('nav.recent_posts')}</SidebarHeading>
                        {recentPosts.map((post) => (
                            <SidebarItem key={post.id} href={`/posts/${post.id}`}>
                                {post.title ?? t('common.untitled')}
                            </SidebarItem>
                        ))}
                    </SidebarSection>
                ) : null}

                <SidebarSpacer />
            </SidebarBody>

            <SidebarFooter className="max-lg:hidden">
                {/* Collapsed rail: expand control sits above the profile avatar */}
                {rail ? <SidebarCollapseToggle mode="expand" /> : null}

                <Dropdown>
                    <DropdownButton as={SidebarItem} className={rail ? 'justify-center' : undefined}>
                        <span className={clsx('flex min-w-0 items-center', rail ? 'justify-center' : 'gap-3')}>
                            <Avatar
                                src={user.avatar_url}
                                initials={userInitials(user.name)}
                                className={rail ? 'size-7' : 'size-10'}
                                square
                                alt=""
                            />
                            {!rail ? (
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                                        {user.name}
                                    </span>
                                    <span className="block truncate text-xs/5 font-normal text-canvas-muted dark:text-canvas-muted-dark">
                                        {user.email}
                                    </span>
                                </span>
                            ) : null}
                        </span>
                    </DropdownButton>
                    <DropdownMenu className="min-w-72" anchor="top start">
                        <UserDropdownContent mode={mode} setMode={setMode} onOpenProfile={onOpenProfile} />
                    </DropdownMenu>
                </Dropdown>
            </SidebarFooter>
        </Sidebar>
    );
}

export default function Layout() {
    return (
        <MobilePageActionProvider>
            <LayoutShell />
        </MobilePageActionProvider>
    );
}

function LayoutShell() {
    const { user, t } = useCanvas();
    const { canManageTaxonomy, canManageUsers } = usePermissions();
    const { pathname } = useLocation();
    const { mode, setMode } = useTheme();
    const { contribution: mobilePageContribution } = useMobilePageActionState();
    const { collapsed, setCollapsed, toggleCollapsed } = useSidebarCollapsed();
    const mobilePageAction = useMemo(
        () =>
            resolveMobilePageAction({
                pathname,
                t,
                contribution: mobilePageContribution,
                canManageTaxonomy,
                canManageUsers,
            }),
        [pathname, t, mobilePageContribution, canManageTaxonomy, canManageUsers]
    );
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
        <SidebarChromeProvider collapsed={collapsed} setCollapsed={setCollapsed} toggleCollapsed={toggleCollapsed}>
            <CommandPalette key={String(paletteOpen)} open={paletteOpen} onClose={closePalette} />
            <Toaster />
            <UserDetailDrawer open={profileOpen} userId={profileOpen ? String(user.id) : null} onClose={closeProfile} />

            <SidebarLayout
                collapsed={collapsed}
                navbar={
                    <Navbar>
                        <NavbarSpacer />
                        <NavbarSection>
                            <NavbarItem onClick={openPalette} aria-label={t('nav.search')}>
                                <IconSearch data-slot="icon" />
                            </NavbarItem>
                            {mobilePageAction ? (
                                typeof mobilePageAction.href === 'string' ? (
                                    <NavbarItem
                                        href={mobilePageAction.href}
                                        aria-label={mobilePageAction.label}
                                        data-mobile-page-action="true"
                                    >
                                        {mobilePageAction.icon}
                                    </NavbarItem>
                                ) : (
                                    <NavbarItem
                                        type="button"
                                        aria-label={mobilePageAction.label}
                                        disabled={mobilePageAction.disabled}
                                        data-mobile-page-action="true"
                                        onClick={mobilePageAction.onClick}
                                    >
                                        {mobilePageAction.icon}
                                    </NavbarItem>
                                )
                            ) : null}
                            <Dropdown>
                                <DropdownButton as={NavbarItem}>
                                    <Avatar src={user.avatar_url} initials={userInitials(user.name)} square />
                                </DropdownButton>
                                <DropdownMenu className="min-w-72" anchor="bottom end">
                                    <UserDropdownContent mode={mode} setMode={setMode} onOpenProfile={openProfile} />
                                </DropdownMenu>
                            </Dropdown>
                        </NavbarSection>
                    </Navbar>
                }
                sidebar={
                    <AppSidebar openPalette={openPalette} mode={mode} setMode={setMode} onOpenProfile={openProfile} />
                }
            >
                <AnimatedOutlet />
            </SidebarLayout>
        </SidebarChromeProvider>
    );
}
