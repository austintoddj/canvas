import { EllipsisVerticalIcon, PlusIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { EmptyState } from '@/components/EmptyState';
import { EmptyStateReveal } from '@/components/EmptyStateReveal';
import { Link } from '@/components/link';
import {
    Dropdown,
    DropdownButton,
    DropdownDivider,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
} from '@/components/dropdown';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table';
import { TableListSkeleton } from '@/components/TableListSkeleton';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { usePermissions } from '@/hooks/usePermissions';
import { isInitialLoading, isRefreshing, shouldShowEmpty } from '@/lib/async-ui';
import { postsApi } from '@/lib/api/posts';
import { paginationWindow, shouldGoToPreviousPageAfterDelete } from '@/lib/list-pagination';
import {
    formatPostDate,
    isPostPublished,
    parsePostsListFilters,
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
    const { canViewAllPosts } = usePermissions();
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = parsePostsListFilters(searchParams);
    const queryKey = searchParams.toString();

    const [response, setResponse] = useState<PostsIndexResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<PostListItem | null>(null);

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
                    setError('Unable to load posts.');
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

    async function reloadPosts() {
        try {
            const data = await postsApi.index(postsIndexQueryParams(parsePostsListFilters(searchParams)));
            setResponse(data);
            setError(null);
        } catch {
            setError('Unable to load posts.');
            setResponse(null);
        }
    }

    function setFilters(patch: Partial<PostsListFilters>, resetPage = false) {
        setSearchParams(updateFilters(searchParams, patch, resetPage));
    }

    function requestDelete(post: PostListItem) {
        setPendingDelete(post);
    }

    function closeDeleteConfirm() {
        if (deletingId !== null) {
            return;
        }

        setPendingDelete(null);
    }

    async function confirmDelete() {
        if (pendingDelete === null) {
            return;
        }

        const post = pendingDelete;
        setDeletingId(post.id);

        try {
            await postsApi.destroy(post.id);

            const posts = response?.posts;
            const shouldGoBack =
                posts !== undefined && shouldGoToPreviousPageAfterDelete(posts.data.length, posts.current_page);

            setPendingDelete(null);

            if (shouldGoBack) {
                setFilters({ page: filters.page - 1 });
                return;
            }

            await reloadPosts();
            toast.success('Post deleted.');
        } catch {
            toast.error('Unable to delete this post.');
        } finally {
            setDeletingId(null);
        }
    }

    const posts: Paginated<PostListItem> | null = response?.posts ?? null;
    const itemCount = posts?.data.length ?? 0;
    const showInitialSkeleton = isInitialLoading(loading, itemCount);
    const refreshing = isRefreshing(loading, itemCount);
    const isEmpty = shouldShowEmpty(loading, itemCount);
    const { animateEmpty, animateContent } = useAsyncReveal(loading, itemCount);
    const emptyHeadline = filters.tab === 'draft' ? 'No drafts yet' : 'No published posts yet';
    const emptyDescription =
        filters.tab === 'draft'
            ? 'Start a draft when you’re ready to write. It stays private until you publish.'
            : 'Publish a post to share it with readers. Drafts live on the other tab until then.';
    const pendingTitle =
        pendingDelete === null
            ? 'this post'
            : pendingDelete.title.trim() === ''
              ? 'Untitled post'
              : `“${pendingDelete.title}”`;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Posts"
                actions={
                    <Button href="/posts/new" color="dark/zinc">
                        <PlusIcon data-slot="icon" />
                        New post
                    </Button>
                }
            >
                <PageDescription>Write, publish, and manage your content</PageDescription>
            </PageHeader>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <PillNav value={filters.tab} onChange={(tab) => setFilters({ tab }, true)} aria-label="Post status">
                    <PillNavItem value="published">
                        Published
                        {response ? <Badge color="zinc">{response.publishedCount}</Badge> : null}
                    </PillNavItem>
                    <PillNavItem value="draft">
                        Drafts
                        {response ? <Badge color="zinc">{response.draftCount}</Badge> : null}
                    </PillNavItem>
                </PillNav>

                {canViewAllPosts ? (
                    <PillNav
                        value={filters.scope}
                        onChange={(scope) => setFilters({ scope }, true)}
                        aria-label="Post author scope"
                    >
                        <PillNavItem value="user">Mine</PillNavItem>
                        <PillNavItem value="all">All authors</PillNavItem>
                    </PillNav>
                ) : null}
            </div>

            {error ? <ErrorText>{error}</ErrorText> : null}

            {showInitialSkeleton ? (
                <TableListSkeleton rows={6} columns={4} />
            ) : isEmpty ? (
                <EmptyStateReveal animate={animateEmpty}>
                    <EmptyState
                        headline={emptyHeadline}
                        description={emptyDescription}
                        visual={<PostsEmptyVisual />}
                        action={
                            <Button href="/posts/new" color="dark/zinc">
                                <PlusIcon data-slot="icon" />
                                Create a post
                            </Button>
                        }
                    />
                </EmptyStateReveal>
            ) : posts ? (
                <ContentReveal busy={refreshing} animate={animateContent}>
                    <Table striped className="[--gutter:--spacing(4)]">
                        <TableHead>
                            <TableRow>
                                <TableHeader>Title</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Views</TableHeader>
                                <TableHeader>Updated</TableHeader>
                                <TableHeader className="text-right">
                                    <span className="sr-only">Actions</span>
                                </TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {posts.data.map((post) => {
                                const published = isPostPublished(post.published_at);
                                const title = post.title.trim() === '' ? 'Untitled post' : post.title;

                                return (
                                    <TableRow key={post.id}>
                                        <TableCell>
                                            <div className="max-w-md">
                                                <Link
                                                    href={`/posts/${post.id}`}
                                                    className="font-medium text-zinc-950 hover:underline dark:text-white"
                                                >
                                                    {title}
                                                </Link>
                                                {post.summary ? (
                                                    <Text className="mt-1 line-clamp-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                                        {post.summary}
                                                    </Text>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge color={published ? 'green' : 'amber'}>
                                                {published ? 'Published' : 'Draft'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{post.views_count.toLocaleString()}</TableCell>
                                        <TableCell className="text-canvas-muted dark:text-canvas-muted-dark">
                                            {formatPostDate(post.updated_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Dropdown>
                                                <DropdownButton plain aria-label={`Actions for ${title}`}>
                                                    <EllipsisVerticalIcon data-slot="icon" />
                                                </DropdownButton>
                                                <DropdownMenu anchor="bottom end">
                                                    <DropdownItem href={`/posts/${post.id}`}>
                                                        <DropdownLabel>Edit</DropdownLabel>
                                                    </DropdownItem>
                                                    {published ? (
                                                        <DropdownItem href={`/posts/${post.id}/stats`}>
                                                            <DropdownLabel>Stats</DropdownLabel>
                                                        </DropdownItem>
                                                    ) : null}
                                                    <DropdownDivider />
                                                    <DropdownItem
                                                        disabled={deletingId === post.id}
                                                        onClick={() => requestDelete(post)}
                                                    >
                                                        <DropdownLabel>
                                                            {deletingId === post.id ? 'Deleting…' : 'Delete'}
                                                        </DropdownLabel>
                                                    </DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
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
                <AlertTitle>Delete post?</AlertTitle>
                <AlertDescription>Delete {pendingTitle}? This cannot be undone.</AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={deletingId !== null} onClick={closeDeleteConfirm}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        color="red"
                        disabled={deletingId !== null}
                        onClick={() => void confirmDelete()}
                    >
                        {deletingId !== null ? 'Deleting…' : 'Delete'}
                    </Button>
                </AlertActions>
            </Alert>
        </div>
    );
}
