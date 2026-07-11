import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Avatar } from '@/components/avatar';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import {
    Dropdown,
    DropdownButton,
    DropdownDivider,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
} from '@/components/dropdown';
import { ContentReveal } from '@/components/ContentReveal';
import { EmptyState } from '@/components/EmptyState';
import { EmptyStateReveal } from '@/components/EmptyStateReveal';
import { Link } from '@/components/link';
import { PageHeader } from '@/components/PageHeader';
import { UsersEmptyVisual } from '@/components/users/UsersEmptyVisual';
import {
    Pagination,
    PaginationGap,
    PaginationList,
    PaginationNext,
    PaginationPage,
    PaginationPrevious,
} from '@/components/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table';
import { TableListSkeleton } from '@/components/TableListSkeleton';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { useCanvas } from '@/hooks/useCanvas';
import { isInitialLoading, isRefreshing, shouldShowEmpty } from '@/lib/async-ui';
import { usersApi } from '@/lib/api/users';
import { paginationWindow, shouldGoToPreviousPageAfterDelete } from '@/lib/list-pagination';
import { toast } from '@/lib/toast';
import { parseUsersListFilters, usersIndexPath, usersIndexQueryParams, type UsersListFilters } from '@/lib/users/list';
import { roleLabel, userInitials } from '@/lib/users/roles';
import type { Paginated } from '@/types/api';
import type { UserResource } from '@/types/boot';

function updateFilters(current: URLSearchParams, patch: Partial<UsersListFilters>): URLSearchParams {
    const next = new URLSearchParams(current);
    const page = patch.page ?? 1;

    if (page > 1) {
        next.set('page', String(page));
    } else {
        next.delete('page');
    }

    return next;
}

function roleBadgeColor(role: number | null | undefined): 'zinc' | 'blue' | 'amber' | 'green' {
    if (role === 3) {
        return 'amber';
    }

    if (role === 2) {
        return 'blue';
    }

    if (role === 1) {
        return 'green';
    }

    return 'zinc';
}

export default function SettingsUsersIndex() {
    const { boot, user: currentUser } = useCanvas();
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = parseUsersListFilters(searchParams);
    const queryKey = searchParams.toString();

    const [response, setResponse] = useState<Paginated<UserResource> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<number | null>(null);
    const [pendingRevoke, setPendingRevoke] = useState<UserResource | null>(null);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        const currentFilters = parseUsersListFilters(searchParams);

        queueMicrotask(() => {
            if (!cancelled) {
                setLoading(true);
                setError(null);
            }
        });

        usersApi
            .index(usersIndexQueryParams(currentFilters), controller.signal)
            .then((data) => {
                if (!cancelled) {
                    setResponse(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Unable to load users.');
                    setResponse(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [queryKey, searchParams]);

    async function reloadUsers() {
        try {
            const data = await usersApi.index(usersIndexQueryParams(parseUsersListFilters(searchParams)));
            setResponse(data);
            setError(null);
        } catch {
            setError('Unable to load users.');
            setResponse(null);
        }
    }

    function setPage(page: number) {
        setSearchParams(updateFilters(searchParams, { page }));
    }

    function requestRevoke(user: UserResource) {
        if (user.id === currentUser.id) {
            toast.error('You cannot revoke your own access.');
            return;
        }

        setPendingRevoke(user);
    }

    function closeRevokeConfirm() {
        if (revokingId !== null) {
            return;
        }

        setPendingRevoke(null);
    }

    async function confirmRevoke() {
        if (pendingRevoke === null) {
            return;
        }

        const user = pendingRevoke;
        setRevokingId(user.id);

        try {
            await usersApi.destroy(String(user.id));

            const shouldGoBack =
                response !== null && shouldGoToPreviousPageAfterDelete(response.data.length, response.current_page);

            setPendingRevoke(null);

            if (shouldGoBack) {
                setPage(filters.page - 1);
                return;
            }

            await reloadUsers();
            toast.success(`Access revoked for ${user.name}.`);
        } catch {
            toast.error('Unable to revoke access.');
        } finally {
            setRevokingId(null);
        }
    }

    const itemCount = response?.data.length ?? 0;
    const showInitialSkeleton = isInitialLoading(loading, itemCount);
    const refreshing = isRefreshing(loading, itemCount);
    const isEmpty = shouldShowEmpty(loading, itemCount);
    const { animateEmpty, animateContent } = useAsyncReveal(loading, itemCount);

    return (
        <div className="space-y-8">
            <PageHeader title="Users">
                <PageDescription>People with Canvas access and their roles</PageDescription>
            </PageHeader>

            {error ? <ErrorText>{error}</ErrorText> : null}

            {showInitialSkeleton ? (
                <TableListSkeleton rows={6} columns={4} />
            ) : isEmpty ? (
                <EmptyStateReveal animate={animateEmpty}>
                    <EmptyState
                        headline="No Canvas users"
                        description="Users appear here once they have a Canvas role. Grant access with the canvas:make-admin Artisan command or by editing a host user id."
                        visual={<UsersEmptyVisual />}
                    />
                </EmptyStateReveal>
            ) : response ? (
                <ContentReveal busy={refreshing} animate={animateContent}>
                    <Table striped className="[--gutter:--spacing(4)]">
                        <TableHead>
                            <TableRow>
                                <TableHeader>User</TableHeader>
                                <TableHeader>Role</TableHeader>
                                <TableHeader>Posts</TableHeader>
                                <TableHeader className="text-right">
                                    <span className="sr-only">Actions</span>
                                </TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {response.data.map((user) => {
                                const role = user.canvas?.role ?? null;
                                const username = user.canvas?.username;

                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={user.avatar_url}
                                                    initials={userInitials(user.name)}
                                                    className="size-9"
                                                    alt=""
                                                />
                                                <div className="min-w-0">
                                                    <Link
                                                        href={`/settings/users/${user.id}`}
                                                        className="font-medium text-zinc-950 hover:underline dark:text-white"
                                                    >
                                                        {user.name}
                                                    </Link>
                                                    <Text className="mt-0.5 truncate text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                                        {username ? `@${username}` : user.email}
                                                    </Text>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge color={roleBadgeColor(role)}>{roleLabel(role, boot.roles)}</Badge>
                                        </TableCell>
                                        <TableCell className="text-canvas-muted dark:text-canvas-muted-dark">
                                            {(user.posts_count ?? 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Dropdown>
                                                <DropdownButton plain aria-label={`Actions for ${user.name}`}>
                                                    <EllipsisVerticalIcon data-slot="icon" />
                                                </DropdownButton>
                                                <DropdownMenu anchor="bottom end">
                                                    <DropdownItem href={`/settings/users/${user.id}`}>
                                                        <DropdownLabel>Edit</DropdownLabel>
                                                    </DropdownItem>
                                                    {user.id !== currentUser.id ? (
                                                        <>
                                                            <DropdownDivider />
                                                            <DropdownItem
                                                                disabled={revokingId === user.id}
                                                                onClick={() => requestRevoke(user)}
                                                            >
                                                                <DropdownLabel>
                                                                    {revokingId === user.id
                                                                        ? 'Revoking…'
                                                                        : 'Revoke access'}
                                                                </DropdownLabel>
                                                            </DropdownItem>
                                                        </>
                                                    ) : null}
                                                </DropdownMenu>
                                            </Dropdown>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {response.last_page > 1 ? (
                        <Pagination className="mt-8">
                            <PaginationPrevious
                                href={
                                    response.current_page > 1
                                        ? usersIndexPath({ page: response.current_page - 1 })
                                        : null
                                }
                            />
                            <PaginationList>
                                {paginationWindow(response.current_page, response.last_page).map((item, index) =>
                                    item === 'gap' ? (
                                        <PaginationGap key={`gap-${index}`} />
                                    ) : (
                                        <PaginationPage
                                            key={item}
                                            href={usersIndexPath({ page: item })}
                                            current={item === response.current_page}
                                        >
                                            {item}
                                        </PaginationPage>
                                    )
                                )}
                            </PaginationList>
                            <PaginationNext
                                href={
                                    response.current_page < response.last_page
                                        ? usersIndexPath({ page: response.current_page + 1 })
                                        : null
                                }
                            />
                        </Pagination>
                    ) : null}
                </ContentReveal>
            ) : null}

            <Alert open={pendingRevoke !== null} onClose={closeRevokeConfirm} size="sm">
                <AlertTitle>Revoke access?</AlertTitle>
                <AlertDescription>
                    Revoke Canvas access for {pendingRevoke?.name}? They will lose the admin dashboard until access is
                    granted again.
                </AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={revokingId !== null} onClick={closeRevokeConfirm}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        color="red"
                        disabled={revokingId !== null}
                        onClick={() => void confirmRevoke()}
                    >
                        {revokingId !== null ? 'Revoking…' : 'Revoke access'}
                    </Button>
                </AlertActions>
            </Alert>
        </div>
    );
}
