import { EllipsisVerticalIcon, PlusIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Link } from '@/components/link';
import {
    Dropdown,
    DropdownButton,
    DropdownDivider,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
} from '@/components/dropdown';
import { Heading } from '@/components/heading';
import {
    Pagination,
    PaginationGap,
    PaginationList,
    PaginationNext,
    PaginationPage,
    PaginationPrevious,
} from '@/components/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table';
import { Text } from '@/components/text';
import { usePermissions } from '@/hooks/usePermissions';
import { postsApi } from '@/lib/api/posts';
import {
    formatPostDate,
    isPostPublished,
    parsePostsListFilters,
    postsIndexPath,
    postsIndexQueryParams,
    type PostsListFilters,
} from '@/lib/posts/list';
import type { Paginated, PostListItem, PostsIndexResponse } from '@/types/api';

function updateFilters(
    current: URLSearchParams,
    patch: Partial<PostsListFilters>,
    resetPage = false
): URLSearchParams {
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

function paginationWindow(currentPage: number, lastPage: number): (number | 'gap')[] {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, lastPage, currentPage, currentPage - 1, currentPage + 1]);
    const sorted = [...pages].filter((page) => page >= 1 && page <= lastPage).sort((a, b) => a - b);
    const result: (number | 'gap')[] = [];

    for (let index = 0; index < sorted.length; index += 1) {
        const page = sorted[index];
        const previous = sorted[index - 1];

        if (index > 0 && previous !== undefined && page - previous > 1) {
            result.push('gap');
        }

        result.push(page);
    }

    return result;
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

    async function handleDelete(post: PostListItem) {
        const title = post.title.trim() === '' ? 'Untitled post' : post.title;
        const confirmed = window.confirm(`Delete “${title}”? This cannot be undone.`);

        if (!confirmed) {
            return;
        }

        setDeletingId(post.id);

        try {
            await postsApi.destroy(post.id);

            const posts = response?.posts;
            const shouldGoBack =
                posts !== undefined && posts.data.length === 1 && posts.current_page > 1 && filters.page > 1;

            if (shouldGoBack) {
                setFilters({ page: filters.page - 1 });
                return;
            }

            await reloadPosts();
        } catch {
            window.alert('Unable to delete this post.');
        } finally {
            setDeletingId(null);
        }
    }

    const posts: Paginated<PostListItem> | null = response?.posts ?? null;

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <Heading>Posts</Heading>
                    <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Manage drafts and published posts
                    </Text>
                </div>
                <Button href="/posts/new" color="dark/zinc">
                    <PlusIcon data-slot="icon" />
                    New post
                </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex rounded-lg border border-zinc-950/10 p-0.5 dark:border-white/10">
                    <Button
                        type="button"
                        plain
                        className={filters.tab === 'published' ? 'bg-zinc-950/5 dark:bg-white/10' : ''}
                        onClick={() => setFilters({ tab: 'published' }, true)}
                    >
                        Published
                        {response ? (
                            <Badge color="zinc" className="ml-2">
                                {response.publishedCount}
                            </Badge>
                        ) : null}
                    </Button>
                    <Button
                        type="button"
                        plain
                        className={filters.tab === 'draft' ? 'bg-zinc-950/5 dark:bg-white/10' : ''}
                        onClick={() => setFilters({ tab: 'draft' }, true)}
                    >
                        Drafts
                        {response ? (
                            <Badge color="zinc" className="ml-2">
                                {response.draftCount}
                            </Badge>
                        ) : null}
                    </Button>
                </div>

                {canViewAllPosts ? (
                    <div className="flex rounded-lg border border-zinc-950/10 p-0.5 dark:border-white/10">
                        <Button
                            type="button"
                            plain
                            className={filters.scope === 'user' ? 'bg-zinc-950/5 dark:bg-white/10' : ''}
                            onClick={() => setFilters({ scope: 'user' }, true)}
                        >
                            Mine
                        </Button>
                        <Button
                            type="button"
                            plain
                            className={filters.scope === 'all' ? 'bg-zinc-950/5 dark:bg-white/10' : ''}
                            onClick={() => setFilters({ scope: 'all' }, true)}
                        >
                            All authors
                        </Button>
                    </div>
                ) : null}
            </div>

            {error ? <Text className="mt-6 text-sm text-red-600 dark:text-red-500">{error}</Text> : null}

            {loading ? (
                <Text className="mt-8 text-sm text-zinc-500">Loading posts…</Text>
            ) : posts === null || posts.data.length === 0 ? (
                <div className="mt-8 rounded-xl border border-dashed border-zinc-950/10 px-6 py-12 text-center dark:border-white/10">
                    <Text className="text-sm text-zinc-500">
                        {filters.tab === 'draft' ? 'No drafts yet.' : 'No published posts yet.'}
                    </Text>
                    <div className="mt-4">
                        <Button href="/posts/new" outline>
                            Create a post
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <Table striped className="mt-8 [--gutter:--spacing(4)]">
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
                                                    <Text className="mt-1 line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">
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
                                        <TableCell className="text-zinc-500 dark:text-zinc-400">
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
                                                        onClick={() => void handleDelete(post)}
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
                </>
            )}
        </div>
    );
}