import { Avatar } from '@/components/avatar';
import {
    Dropdown,
    DropdownButton,
    DropdownDivider,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
} from '@/components/dropdown';
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '@/components/navbar';
import {
    Sidebar,
    SidebarBody,
    SidebarFooter,
    SidebarHeader,
    SidebarHeading,
    SidebarItem,
    SidebarLabel,
    SidebarSection,
    SidebarSpacer,
} from '@/components/sidebar';
import { SidebarLayout } from '@/components/sidebar-layout';
import {
    ArrowRightStartOnRectangleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    Cog8ToothIcon,
    LightBulbIcon,
    ShieldCheckIcon,
    UserIcon,
} from '@heroicons/react/16/solid';
import {
    Cog6ToothIcon,
    DocumentTextIcon,
    HomeIcon,
    InboxIcon,
    MagnifyingGlassIcon,
    PhotoIcon,
    QuestionMarkCircleIcon,
    SparklesIcon,
    TagIcon,
} from '@heroicons/react/20/solid';
import { Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
    const { user } = window.Canvas;
    const { pathname } = useLocation();

    return (
        <SidebarLayout
            navbar={
                <Navbar>
                    <NavbarSpacer />
                    <NavbarSection>
                        <NavbarItem href="/search" aria-label="Search">
                            <MagnifyingGlassIcon />
                        </NavbarItem>
                        <NavbarItem href="/inbox" aria-label="Inbox">
                            <InboxIcon />
                        </NavbarItem>
                        <Dropdown>
                            <DropdownButton as={NavbarItem}>
                                <Avatar src={user.avatar_url} square />
                            </DropdownButton>
                            <DropdownMenu className="min-w-64" anchor="bottom end">
                                <DropdownItem href="/settings">
                                    <UserIcon />
                                    <DropdownLabel>My profile</DropdownLabel>
                                </DropdownItem>
                                <DropdownItem href="/settings">
                                    <Cog8ToothIcon />
                                    <DropdownLabel>Settings</DropdownLabel>
                                </DropdownItem>
                                <DropdownDivider />
                                <DropdownItem href="/privacy-policy">
                                    <ShieldCheckIcon />
                                    <DropdownLabel>Privacy policy</DropdownLabel>
                                </DropdownItem>
                                <DropdownItem href="/feedback">
                                    <LightBulbIcon />
                                    <DropdownLabel>Share feedback</DropdownLabel>
                                </DropdownItem>
                                <DropdownDivider />
                                <DropdownItem href="/logout">
                                    <ArrowRightStartOnRectangleIcon />
                                    <DropdownLabel>Sign out</DropdownLabel>
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </NavbarSection>
                </Navbar>
            }
            sidebar={
                <Sidebar>
                    <SidebarHeader>
                        <Dropdown>
                            <DropdownButton as={SidebarItem} className="lg:mb-2.5">
                                <Avatar
                                    initials="C"
                                    className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                    square
                                />
                                <SidebarLabel>Canvas</SidebarLabel>
                                <ChevronDownIcon />
                            </DropdownButton>
                            <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
                                <DropdownItem href="/settings">
                                    <Cog8ToothIcon />
                                    <DropdownLabel>Settings</DropdownLabel>
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                        <SidebarSection className="max-lg:hidden">
                            <SidebarItem href="/search">
                                <MagnifyingGlassIcon />
                                <SidebarLabel>Search</SidebarLabel>
                            </SidebarItem>
                            <SidebarItem href="/inbox">
                                <InboxIcon />
                                <SidebarLabel>Inbox</SidebarLabel>
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
                            <SidebarItem href="/tags" current={pathname.startsWith('/tags')}>
                                <TagIcon />
                                <SidebarLabel>Tags</SidebarLabel>
                            </SidebarItem>
                            <SidebarItem href="/settings" current={pathname.startsWith('/settings')}>
                                <Cog6ToothIcon />
                                <SidebarLabel>Settings</SidebarLabel>
                            </SidebarItem>
                        </SidebarSection>

                        <SidebarSection className="max-lg:hidden">
                            <SidebarHeading>Recent Posts</SidebarHeading>
                            <SidebarItem href="/posts/1">Getting Started with Canvas</SidebarItem>
                            <SidebarItem href="/posts/2">Writing in Markdown</SidebarItem>
                            <SidebarItem href="/posts/3">Publishing Your First Post</SidebarItem>
                            <SidebarItem href="/posts/4">Customizing Your Blog</SidebarItem>
                        </SidebarSection>

                        <SidebarSpacer />

                        <SidebarSection>
                            <SidebarItem href="/support">
                                <QuestionMarkCircleIcon />
                                <SidebarLabel>Support</SidebarLabel>
                            </SidebarItem>
                            <SidebarItem href="/changelog">
                                <SparklesIcon />
                                <SidebarLabel>Changelog</SidebarLabel>
                            </SidebarItem>
                        </SidebarSection>
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
                                <ChevronUpIcon />
                            </DropdownButton>
                            <DropdownMenu className="min-w-64" anchor="top start">
                                <DropdownItem href="/settings">
                                    <UserIcon />
                                    <DropdownLabel>My profile</DropdownLabel>
                                </DropdownItem>
                                <DropdownItem href="/settings">
                                    <Cog8ToothIcon />
                                    <DropdownLabel>Settings</DropdownLabel>
                                </DropdownItem>
                                <DropdownDivider />
                                <DropdownItem href="/privacy-policy">
                                    <ShieldCheckIcon />
                                    <DropdownLabel>Privacy policy</DropdownLabel>
                                </DropdownItem>
                                <DropdownItem href="/feedback">
                                    <LightBulbIcon />
                                    <DropdownLabel>Share feedback</DropdownLabel>
                                </DropdownItem>
                                <DropdownDivider />
                                <DropdownItem href="/logout">
                                    <ArrowRightStartOnRectangleIcon />
                                    <DropdownLabel>Sign out</DropdownLabel>
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </SidebarFooter>
                </Sidebar>
            }
        >
            <Outlet />
        </SidebarLayout>
    );
}
