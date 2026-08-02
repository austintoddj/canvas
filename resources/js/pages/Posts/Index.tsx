import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { EmptyState } from '@/components/EmptyState';
import { EmptyStateReveal } from '@/components/EmptyStateReveal';
import { FadeInImage } from '@/components/FadeInImage';
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
import { Link } from '@/components/link';
import { Table, TableBody, TableCell, TableRow } from '@/components/table';
import { TableListSkeleton } from '@/components/TableListSkeleton';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMobilePageAction } from '@/hooks/useMobilePageAction';
import { usePermissions } from '@/hooks/usePermissions';
import { invalidateRecentPosts } from '@/hooks/useRecentPosts';
import { isInitialLoading, isRefreshing, shouldShowEmpty } from '@/lib/async-ui';
import { postsApi } from '@/lib/api/posts';
import { calendarIndexPath } from '@/lib/calendar/month';
import { formatListDate } from '@/lib/format-list-date';
import { paginationWindow, shouldGoToPreviousPageAfterDelete } from '@/lib/list-pagination';
import {
    countsAfterPostDelete,
    parsePostsListFilters,
    postListStatus,
    postsIndexPath,
    postsIndexQueryParams,
    type PostsListFilters,
} from '@/lib/posts/list';
import { toast } from '@/lib/toast';
import type { Paginated, PostListItem, PostsIndexResponse } from '@/types/api';
import { IconChartBar, IconPlus, IconTrash } from '@tabler/icons-react';

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

    useDocumentTitle(t('posts.title'));

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
            invalidateRecentPosts({ removeId: postId });
            toast.success(t('editor.deleted'));

            const status = postListStatus(pendingDelete.published_at);

            setResponse((current) => {
                if (current === null) {
                    return current;
                }

                return {
                    ...current,
                    ...countsAfterPostDelete(current, status),
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
        pendingDelete === null || (pendingDelete.title ?? '').trim() === ''
            ? t('posts.this_post')
            : `“${(pendingDelete.title ?? '').trim()}”`;
    /** Show through load; hide only when empty state owns the CTA. */
    const showCreateAction = !isEmpty;
    useMobilePageAction({ visible: showCreateAction });

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('posts.title')}
                actions={
                    showCreateAction ? (
                        <Button href="/posts/new" outline>
                            <IconPlus data-slot="icon" />
                            {t('posts.new')}
                        </Button>
                    ) : undefined
                }
            >
                <PageDescription>{t('posts.description')}</PageDescription>
            </PageHeader>

            <div
                className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4"
                data-posts-list-filters="true"
            >
                <PillNav
                    value={filters.tab}
                    onChange={(tab) => setFilters({ tab }, true)}
                    aria-label={t('posts.type_label')}
                    className="w-full sm:w-auto"
                >
                    <PillNavItem value="published" className="flex-1 justify-center sm:flex-none">
                        {t('posts.type_published')}
                        {response ? <Badge color="zinc">{response.publishedCount}</Badge> : null}
                    </PillNavItem>
                    <PillNavItem value="draft" className="flex-1 justify-center sm:flex-none">
                        {t('posts.type_drafts')}
                        {response ? <Badge color="zinc">{response.draftCount}</Badge> : null}
                    </PillNavItem>
                </PillNav>

                <div className="flex flex-wrap items-center gap-3 sm:ms-auto">
                    {canViewAllPosts ? (
                        <PillNav
                            value={filters.scope}
                            onChange={(scope) => setFilters({ scope }, true)}
                            aria-label={t('posts.scope_label')}
                            className="w-full sm:w-auto"
                        >
                            <PillNavItem value="user" className="flex-1 justify-center sm:flex-none">
                                {t('posts.scope_mine')}
                            </PillNavItem>
                            <PillNavItem value="all" className="flex-1 justify-center sm:flex-none">
                                {t('posts.scope_all')}
                            </PillNavItem>
                        </PillNav>
                    ) : null}

                    {filters.tab === 'draft' ? (
                        <Link
                            href={calendarIndexPath({
                                scope: canViewAllPosts && filters.scope === 'all' ? 'all' : 'user',
                            })}
                            className="text-sm font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                            data-posts-calendar-link="true"
                        >
                            {t('posts.view_calendar', 'View calendar')}
                        </Link>
                    ) : null}
                </div>
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
                                <IconPlus data-slot="icon" />
                                {t('posts.empty_cta')}
                            </Button>
                        }
                    />
                </EmptyStateReveal>
            ) : posts ? (
                <ContentReveal busy={refreshing} animate={animateContent}>
                    {/* Allow wrap so dense mobile rows don't force horizontal page scroll. */}
                    <Table striped className="whitespace-normal">
                        <TableBody>
                            {posts.data.map((post) => {
                                const status = postListStatus(post.published_at);
                                const rawTitle = (post.title ?? '').trim();
                                const title = rawTitle === '' ? t('editor.untitled_post') : rawTitle;
                                const badgeColor =
                                    status === 'published' ? 'green' : status === 'scheduled' ? 'blue' : 'amber';
                                const badgeLabel =
                                    status === 'published'
                                        ? t('posts.type_published')
                                        : status === 'scheduled'
                                          ? t('posts.scheduled_badge')
                                          : t('posts.draft_badge');
                                const thumb = (post.featured_image ?? '').trim();
                                const listDate = formatListDate(post.updated_at);
                                const summaryLine = post.summary?.trim()
                                    ? post.summary
                                    : `${post.views_count.toLocaleString()} views`;

                                return (
                                    <TableRow
                                        key={post.id}
                                        className="group/list-row cursor-pointer hover:bg-zinc-950/5 dark:hover:bg-white/5"
                                        tabIndex={0}
                                        aria-label={t('common.edit_aria', { name: title })}
                                        onClick={() => navigate(`/posts/${post.id}`)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                navigate(`/posts/${post.id}`);
                                            }
                                        }}
                                    >
                                        <TableCell className="w-full max-w-0 whitespace-normal">
                                            <div className="flex min-w-0 items-start gap-3 sm:items-center">
                                                {thumb !== '' ? (
                                                    <FadeInImage
                                                        src={thumb}
                                                        alt=""
                                                        className="mt-0.5 size-9 shrink-0 rounded-lg object-cover sm:mt-0"
                                                    />
                                                ) : null}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                        <span className="min-w-0 break-words font-medium text-zinc-950 sm:truncate dark:text-white">
                                                            {title}
                                                        </span>
                                                        <Badge color={badgeColor} data-publish-status={status}>
                                                            {badgeLabel}
                                                        </Badge>
                                                        {post.has_pending_changes ? (
                                                            <Badge color="zinc" data-pending-changes="true">
                                                                {t('dashboard.pending_badge')}
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                    <Text className="mt-1 line-clamp-2 text-sm text-canvas-muted sm:line-clamp-1 dark:text-canvas-muted-dark">
                                                        <span className="sm:hidden">{listDate} · </span>
                                                        {summaryLine}
                                                    </Text>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-px whitespace-nowrap align-top sm:align-middle">
                                            {/* Date lives under the title on mobile; end rail is icons only there. */}
                                            <ListRowEnd
                                                date={listDate}
                                                className="max-sm:[&_[data-list-row-date]]:hidden"
                                            >
                                                {status === 'published' ? (
                                                    <ListRowActionLink
                                                        href={`/posts/${post.id}/stats`}
                                                        label={t('dashboard.recent_stats_aria', { title })}
                                                        tooltip={t('editor.stats')}
                                                    >
                                                        <IconChartBar className="size-5" aria-hidden="true" />
                                                    </ListRowActionLink>
                                                ) : null}
                                                <ListRowActionButton
                                                    label={t('common.delete_aria', { name: title })}
                                                    tooltip={t('common.delete')}
                                                    danger
                                                    onClick={() => setPendingDelete(post)}
                                                >
                                                    <IconTrash className="size-5" aria-hidden="true" />
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
                <AlertDescription>{t('editor.delete_confirm_body', { title: deleteLabel })}</AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={deleting} onClick={closeDeleteConfirm}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="button" color="red" disabled={deleting} onClick={() => void confirmDelete()}>
                        {deleting ? t('common.deleting') : t('common.delete')}
                    </Button>
                </AlertActions>
            </Alert>
        </div>
    );
}
