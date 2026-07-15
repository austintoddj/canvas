import { ChartBarIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { EmptyState } from '@/components/EmptyState';
import { EmptyStateReveal } from '@/components/EmptyStateReveal';
import { ListRowActionButton, ListRowActionLink, ListRowEnd } from '@/components/ListRowEnd';
import { PageHeader } from '@/components/PageHeader';
import { PostsEmptyVisual } from '@/components/posts/PostsEmptyVisual';
import {
    Pagination,
    PaginationGap,
    PaginationList,
    PaginationNext,
    PaginationPage,
    PaginationPrevious,
} from '@/components/pagination';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { Table, TableBody, TableCell, TableRow } from '@/components/table';
import { TableListSkeleton } from '@/components/TableListSkeleton';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { useCanvas } from '@/hooks/useCanvas';
import { usePermissions } from '@/hooks/usePermissions';
import { isInitialLoading, isRefreshing, shouldShowEmpty } from '@/lib/async-ui';
import { postsApi } from '@/lib/api/posts';
import { formatListDate } from '@/lib/format-list-date';
import { paginationWindow, shouldGoToPreviousPageAfterDelete } from '@/lib/list-pagination';
import {
    parsePostsListFilters,
    postListStatus,
    postsIndexPath,
    postsIndexQueryParams,
    type PostsListFilters,
} from '@/lib/posts/list';
import { toast } from '@/lib/toast';
import type { Paginated, PostListItem, PostsIndexResponse } from '@/types/api';

function updateFilters(current: URLSearchParams, patch: Partial<PostsListFilters>, resetPage = false): URLSearchParams {
    const next = new URLSearchParams(current);

    if (patch.tab !== undefined) {
        if (patch.tab === 'draft') {
            next.set('type', 'draft');
        } else {
            next.delete('type');
        }
    }

    if (patch.scope !== undefined) {
        if (patch.scope === 'all') {
            next.set('scope', 'all');
        } else {
            next.delete('scope');
        }
    }

    if (resetPage || patch.page !== undefined) {
        const page = resetPage ? 1 : (patch.page ?? 1);

        if (page > 1) {
            next.set('page', String(page));
        } else {
            next.delete('page');
        }
    }

    return next;
}

export default function PostsIndex() {
    const navigate = useNavigate();
    const { t } = useCanvas();
    const { canViewAllPosts } = usePermissions();
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = parsePostsListFilters(searchParams);
    const queryKey = searchParams.toString();

    const [response, setResponse] = useState<PostsIndexResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<PostListItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        const currentFilters = parsePostsListFilters(searchParams);

        queueMicrotask(() => {
            if (!cancelled) {
                setLoading(true);
                setError(null);
            }
        });

        postsApi
            .index(postsIndexQueryParams(currentFilters), controller.signal)
            .then((data) => {
                if (!cancelled) {
                    setResponse(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(t('posts.load_error'));
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
    }, [queryKey, searchParams, t]);

    function setFilters(patch: Partial<PostsListFilters>, resetPage = false) {
        setSearchParams(updateFilters(searchParams, patch, resetPage));
    }

    function closeDeleteConfirm() {
        if (deleting) {
            return;
        }

        setPendingDelete(null);
    }

    async function confirmDelete() {
        if (pendingDelete === null || deleting) {
            return;
        }

        setDeleting(true);
        const postId = pendingDelete.id;
        const remaining = (response?.posts.data.length ?? 1) - 1;
        const currentPage = response?.posts.current_page ?? filters.page;

        try {
            await postsApi.destroy(postId);
            setPendingDelete(null);
            toast.success(t('editor.deleted'));

            setResponse((current) => {
                if (current === null) {
                    return current;
                }

                return {
                    ...current,
                    posts: {
                        ...current.posts,
                        data: current.posts.data.filter((item) => item.id !== postId),
                    },
                };
            });

            if (shouldGoToPreviousPageAfterDelete(remaining + 1, currentPage) && filters.page > 1) {
                setSearchParams(updateFilters(searchParams, { page: filters.page - 1 }));
            }
        } catch {
            toast.error(t('editor.delete_error'));
        } finally {
            setDeleting(false);
        }
    }

    const posts: Paginated<PostListItem> | null = response?.posts ?? null;
    const itemCount = posts?.data.length ?? 0;
    const showInitialSkeleton = isInitialLoading(loading, itemCount);
    const refreshing = isRefreshing(loading, itemCount);
    const isEmpty = shouldShowEmpty(loading, itemCount);
    const { animateEmpty, animateContent } = useAsyncReveal(loading, itemCount);
    const emptyHeadline =
        filters.tab === 'draft' ? t('posts.empty_drafts_headline') : t('posts.empty_published_headline');
    const emptyDescription = filters.tab === 'draft' ? t('posts.empty_drafts_blurb') : t('posts.empty_published_blurb');
    const deleteLabel =
        pendingDelete === null || pendingDelete.title.trim() === ''
            ? t('posts.this_post')
            : `“${pendingDelete.title.trim()}”`;

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('posts.title')}
                actions={
                    <Button href="/posts/new" color="dark/zinc">
                        <PlusIcon data-slot="icon" />
                        {t('posts.new')}
                    </Button>
                }
            >
                <PageDescription>{t('posts.description')}</PageDescription>
            </PageHeader>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <PillNav
                    value={filters.tab}
                    onChange={(tab) => setFilters({ tab }, true)}
                    aria-label={t('posts.type_label')}
                >
                    <PillNavItem value="published">
                        {t('posts.type_published')}
                        {response ? <Badge color="zinc">{response.publishedCount}</Badge> : null}
                    </PillNavItem>
                    <PillNavItem value="draft">
                        {t('posts.type_drafts')}
                        {response ? <Badge color="zinc">{response.draftCount}</Badge> : null}
                    </PillNavItem>
                </PillNav>

                {canViewAllPosts ? (
                    <PillNav
                        value={filters.scope}
                        onChange={(scope) => setFilters({ scope }, true)}
                        aria-label={t('posts.scope_label')}
                    >
                        <PillNavItem value="user">{t('posts.scope_mine')}</PillNavItem>
                        <PillNavItem value="all">{t('posts.scope_all')}</PillNavItem>
                    </PillNav>
                ) : null}
            </div>

            {error ? <ErrorText>{error}</ErrorText> : null}

            {showInitialSkeleton ? (
                <TableListSkeleton rows={6} columns={3} />
            ) : isEmpty ? (
                <EmptyStateReveal animate={animateEmpty}>
                    <EmptyState
                        headline={emptyHeadline}
                        description={emptyDescription}
                        visual={<PostsEmptyVisual />}
                        action={
                            <Button href="/posts/new" color="dark/zinc">
                                <PlusIcon data-slot="icon" />
                                {t('posts.empty_cta')}
                            </Button>
                        }
                    />
                </EmptyStateReveal>
            ) : posts ? (
                <ContentReveal busy={refreshing} animate={animateContent}>
                    <Table striped>
                        <TableBody>
                            {posts.data.map((post) => {
                                const status = postListStatus(post.published_at);
                                const title = post.title.trim() === '' ? 'Untitled post' : post.title;
                                const badgeColor =
                                    status === 'published' ? 'green' : status === 'scheduled' ? 'blue' : 'amber';
                                const badgeLabel =
                                    status === 'published'
                                        ? t('posts.type_published')
                                        : status === 'scheduled'
                                          ? t('posts.scheduled_badge')
                                          : t('posts.draft_badge');

                                return (
                                    <TableRow
                                        key={post.id}
                                        className="group/list-row cursor-pointer hover:bg-zinc-950/5 dark:hover:bg-white/5"
                                        tabIndex={0}
                                        aria-label={`Edit ${title}`}
                                        onClick={() => navigate(`/posts/${post.id}`)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                navigate(`/posts/${post.id}`);
                                            }
                                        }}
                                    >
                                        <TableCell className="w-full max-w-0">
                                            <div className="min-w-0">
                                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                    <span className="truncate font-medium text-zinc-950 dark:text-white">
                                                        {title}
                                                    </span>
                                                    <Badge color={badgeColor} data-publish-status={status}>
                                                        {badgeLabel}
                                                    </Badge>
                                                </div>
                                                <Text className="mt-1 line-clamp-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                                    {post.summary?.trim()
                                                        ? post.summary
                                                        : `${post.views_count.toLocaleString()} views`}
                                                </Text>
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-px whitespace-nowrap">
                                            <ListRowEnd date={formatListDate(post.updated_at)}>
                                                {status === 'published' ? (
                                                    <ListRowActionLink
                                                        href={`/posts/${post.id}/stats`}
                                                        label={`View stats for ${title}`}
                                                    >
                                                        <ChartBarIcon className="size-5" aria-hidden="true" />
                                                    </ListRowActionLink>
                                                ) : null}
                                                <ListRowActionButton
                                                    label={`Delete ${title}`}
                                                    danger
                                                    onClick={() => setPendingDelete(post)}
                                                >
                                                    <TrashIcon className="size-5" aria-hidden="true" />
                                                </ListRowActionButton>
                                            </ListRowEnd>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {posts.last_page > 1 ? (
                        <Pagination className="mt-8">
                            <PaginationPrevious
                                href={
                                    posts.current_page > 1
                                        ? postsIndexPath({ ...filters, page: posts.current_page - 1 })
                                        : null
                                }
                            />
                            <PaginationList>
                                {paginationWindow(posts.current_page, posts.last_page).map((item, index) =>
                                    item === 'gap' ? (
                                        <PaginationGap key={`gap-${index}`} />
                                    ) : (
                                        <PaginationPage
                                            key={item}
                                            href={postsIndexPath({ ...filters, page: item })}
                                            current={item === posts.current_page}
                                        >
                                            {item}
                                        </PaginationPage>
                                    )
                                )}
                            </PaginationList>
                            <PaginationNext
                                href={
                                    posts.current_page < posts.last_page
                                        ? postsIndexPath({ ...filters, page: posts.current_page + 1 })
                                        : null
                                }
                            />
                        </Pagination>
                    ) : null}
                </ContentReveal>
            ) : null}

            <Alert open={pendingDelete !== null} onClose={closeDeleteConfirm} size="sm">
                <AlertTitle>{t('editor.delete_title')}</AlertTitle>
                <AlertDescription>Delete {deleteLabel}? This cannot be undone.</AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={deleting} onClick={closeDeleteConfirm}>
                        Cancel
                    </Button>
                    <Button type="button" color="red" disabled={deleting} onClick={() => void confirmDelete()}>
                        {deleting ? 'Deleting…' : 'Delete'}
                    </Button>
                </AlertActions>
            </Alert>
        </div>
    );
}
