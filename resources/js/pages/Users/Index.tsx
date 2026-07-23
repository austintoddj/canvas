import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Avatar } from '@/components/avatar';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { EmptyState } from '@/components/EmptyState';
import { EmptyStateReveal } from '@/components/EmptyStateReveal';
import { ListRowActionButton, ListRowEnd } from '@/components/ListRowEnd';
import { PageHeader } from '@/components/PageHeader';
import { GrantAccessDrawer } from '@/components/users/GrantAccessDrawer';
import { UserDetailDrawer } from '@/components/users/UserDetailDrawer';
import { UsersEmptyVisual } from '@/components/users/UsersEmptyVisual';
import {
    Pagination,
    PaginationGap,
    PaginationList,
    PaginationNext,
    PaginationPage,
    PaginationPrevious,
} from '@/components/pagination';
import { Table, TableBody, TableCell, TableRow } from '@/components/table';
import { TableListSkeleton } from '@/components/TableListSkeleton';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { isInitialLoading, isRefreshing, shouldShowEmpty } from '@/lib/async-ui';
import { usersApi } from '@/lib/api/users';
import { formatListDate } from '@/lib/format-list-date';
import { paginationWindow, shouldGoToPreviousPageAfterDelete } from '@/lib/list-pagination';
import { toast } from '@/lib/toast';
import {
    parseUsersListFilters,
    setUserDetailParam,
    userDetailId,
    usersIndexPath,
    usersIndexQueryParams,
} from '@/lib/users/list';
import { roleLabel, userInitials } from '@/lib/users/roles';
import type { Paginated } from '@/types/api';
import type { UserResource } from '@/types/boot';
import { IconPlus, IconTrash } from '@tabler/icons-react';

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

export default function UsersIndex() {
    const { boot, t } = useCanvas();
    const currentUserId = boot.user.id;
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = parseUsersListFilters(searchParams);
    const detailId = userDetailId(searchParams);

    const [response, setResponse] = useState<Paginated<UserResource> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [grantOpen, setGrantOpen] = useState(false);
    const [pendingRevoke, setPendingRevoke] = useState<UserResource | null>(null);
    const [revoking, setRevoking] = useState(false);

    useDocumentTitle(t('users.title'));

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        queueMicrotask(() => {
            if (!cancelled) {
                setLoading(true);
                setError(null);
            }
        });

        usersApi
            .index(usersIndexQueryParams({ page: filters.page }), controller.signal)
            .then((data) => {
                if (!cancelled) {
                    setResponse(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(t('users.load_error'));
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
    }, [filters.page, t]);

    async function reloadUsers() {
        try {
            const data = await usersApi.index(usersIndexQueryParams(parseUsersListFilters(searchParams)));
            setResponse(data);
            setError(null);
        } catch {
            setError(t('users.load_error'));
            setResponse(null);
        }
    }

    function openDetail(userId: number) {
        setSearchParams(setUserDetailParam(searchParams, userId), { replace: false });
    }

    function closeDetail() {
        setSearchParams(setUserDetailParam(searchParams, null), { replace: true });
    }

    function closeRevokeConfirm() {
        if (revoking) {
            return;
        }

        setPendingRevoke(null);
    }

    async function confirmRevoke() {
        if (pendingRevoke === null || revoking || pendingRevoke.id === currentUserId) {
            return;
        }

        setRevoking(true);
        const userId = pendingRevoke.id;
        const name = pendingRevoke.name;
        const remaining = (response?.data.length ?? 1) - 1;
        const currentPage = response?.current_page ?? filters.page;

        try {
            await usersApi.destroy(String(userId));
            setPendingRevoke(null);
            toast.success(`Access revoked for ${name}.`);

            if (detailId === String(userId)) {
                closeDetail();
            }

            setResponse((current) => {
                if (current === null) {
                    return current;
                }

                return {
                    ...current,
                    data: current.data.filter((item) => item.id !== userId),
                };
            });

            if (shouldGoToPreviousPageAfterDelete(remaining + 1, currentPage) && filters.page > 1) {
                const next = setUserDetailParam(searchParams, null);

                if (filters.page - 1 > 1) {
                    next.set('page', String(filters.page - 1));
                } else {
                    next.delete('page');
                }

                setSearchParams(next, { replace: true });
            } else {
                void reloadUsers();
            }
        } catch {
            toast.error(t('users.revoke_error'));
        } finally {
            setRevoking(false);
        }
    }

    const itemCount = response?.data.length ?? 0;
    const showInitialSkeleton = isInitialLoading(loading, itemCount);
    const refreshing = isRefreshing(loading, itemCount);
    const isEmpty = shouldShowEmpty(loading, itemCount);
    const { animateEmpty, animateContent } = useAsyncReveal(loading, itemCount);

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('users.title')}
                actions={
                    !showInitialSkeleton && !isEmpty ? (
                        <Button type="button" outline onClick={() => setGrantOpen(true)}>
                            <IconPlus data-slot="icon" />
                            {t('users.invite')}
                        </Button>
                    ) : undefined
                }
            >
                <PageDescription>{t('users.description')}</PageDescription>
            </PageHeader>

            {error ? <ErrorText>{error}</ErrorText> : null}

            {showInitialSkeleton ? (
                <TableListSkeleton rows={6} columns={2} />
            ) : isEmpty ? (
                <EmptyStateReveal animate={animateEmpty}>
                    <EmptyState
                        headline={t('users.empty_headline')}
                        description={t('users.empty_blurb')}
                        visual={<UsersEmptyVisual />}
                        action={
                            <Button type="button" color="dark/zinc" onClick={() => setGrantOpen(true)}>
                                <IconPlus data-slot="icon" />
                                {t('users.invite')}
                            </Button>
                        }
                    />
                </EmptyStateReveal>
            ) : response ? (
                <ContentReveal busy={refreshing} animate={animateContent}>
                    <Table striped>
                        <TableBody>
                            {response.data.map((user) => {
                                const role = user.canvas?.role ?? null;
                                const username = user.canvas?.username;
                                const selected = detailId === String(user.id);
                                const isSelf = user.id === currentUserId;
                                const postsCount = user.posts_count ?? 0;

                                return (
                                    <TableRow
                                        key={user.id}
                                        className={
                                            selected
                                                ? 'group/list-row cursor-pointer bg-zinc-950/5 dark:bg-white/5'
                                                : 'group/list-row cursor-pointer hover:bg-zinc-950/5 dark:hover:bg-white/5'
                                        }
                                        tabIndex={0}
                                        aria-label={`Edit ${user.name}`}
                                        data-selected={selected ? 'true' : undefined}
                                        onClick={() => openDetail(user.id)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                openDetail(user.id);
                                            }
                                        }}
                                    >
                                        <TableCell className="w-full max-w-0">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <Avatar
                                                    src={user.avatar_url}
                                                    initials={userInitials(user.name)}
                                                    className="size-9 shrink-0"
                                                    alt=""
                                                />
                                                <div className="min-w-0">
                                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                        <span className="truncate font-medium text-zinc-950 dark:text-white">
                                                            {user.name}
                                                        </span>
                                                        <Badge color={roleBadgeColor(role)}>
                                                            {roleLabel(role, boot.roles)}
                                                        </Badge>
                                                    </div>
                                                    <Text className="mt-0.5 truncate text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                                        {username ? `@${username}` : user.email}
                                                        {' · '}
                                                        {postsCount.toLocaleString()}{' '}
                                                        {postsCount === 1 ? 'post' : 'posts'}
                                                    </Text>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-px whitespace-nowrap">
                                            <ListRowEnd date={formatListDate(user.canvas?.updated_at)}>
                                                {!isSelf ? (
                                                    <ListRowActionButton
                                                        label={`Revoke access for ${user.name}`}
                                                        danger
                                                        onClick={() => setPendingRevoke(user)}
                                                    >
                                                        <IconTrash className="size-5" aria-hidden="true" />
                                                    </ListRowActionButton>
                                                ) : null}
                                            </ListRowEnd>
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

            <UserDetailDrawer
                open={detailId !== null}
                userId={detailId}
                onClose={closeDetail}
                onSaved={(saved) => {
                    setResponse((current) => {
                        if (current === null) {
                            void reloadUsers();
                            return current;
                        }

                        return {
                            ...current,
                            data: current.data.map((item) => (item.id === saved.id ? { ...item, ...saved } : item)),
                        };
                    });
                }}
                onRevoked={(revokedId) => {
                    setResponse((current) => {
                        if (current === null) {
                            return current;
                        }

                        return {
                            ...current,
                            data: current.data.filter((item) => item.id !== revokedId),
                        };
                    });
                    void reloadUsers();
                }}
            />

            <GrantAccessDrawer
                open={grantOpen}
                onClose={() => setGrantOpen(false)}
                onGranted={(user) => {
                    void reloadUsers().then(() => {
                        openDetail(user.id);
                    });
                }}
                onOpenExisting={(userId) => {
                    openDetail(userId);
                }}
            />

            <Alert open={pendingRevoke !== null} onClose={closeRevokeConfirm} size="sm">
                <AlertTitle>{t('users.revoke_title')}</AlertTitle>
                <AlertDescription>
                    Revoke Canvas access for {pendingRevoke?.name ?? 'this user'}? They will no longer be able to use
                    Canvas until invited again.
                </AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={revoking} onClick={closeRevokeConfirm}>
                        Cancel
                    </Button>
                    <Button type="button" color="red" disabled={revoking} onClick={() => void confirmRevoke()}>
                        {revoking ? 'Revoking…' : 'Revoke access'}
                    </Button>
                </AlertActions>
            </Alert>
        </div>
    );
}
