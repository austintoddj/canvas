import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/badge';
import { FadeInImage } from '@/components/FadeInImage';
import { Subheading } from '@/components/heading';
import { Link } from '@/components/link';
import { ListRowActionLink, ListRowEnd } from '@/components/ListRowEnd';
import { Table, TableBody, TableCell, TableRow } from '@/components/table';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import type { DashboardScope } from '@/lib/dashboard';
import { formatListDate } from '@/lib/format-list-date';
import { postListStatus, postsIndexPath } from '@/lib/posts/list';
import type { DashboardRecentPost } from '@/types/api';
import { IconChartBar } from '@tabler/icons-react';

type DashboardRecentPostsProps = {
    posts: DashboardRecentPost[];
    scope: DashboardScope;
};

export function DashboardRecentPosts({ posts, scope }: DashboardRecentPostsProps) {
    const navigate = useNavigate();
    const { t } = useCanvas();

    if (posts.length === 0) {
        return null;
    }

    return (
        <section className="space-y-4" data-dashboard-recent-posts="true">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <Subheading level={2}>{t('dashboard.recent_title')}</Subheading>
                    <Text className="mt-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                        {t('dashboard.recent_subtitle')}
                    </Text>
                </div>
                <Link
                    href={postsIndexPath({ scope })}
                    className="text-sm font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                >
                    {t('dashboard.recent_view_all')}
                </Link>
            </div>

            <Table striped>
                <TableBody>
                    {posts.map((post) => {
                        const status = postListStatus(post.published_at);
                        const rawTitle = (post.title ?? '').trim();
                        const title = rawTitle === '' ? t('editor.untitled_post') : rawTitle;
                        const badgeColor = status === 'published' ? 'green' : status === 'scheduled' ? 'blue' : 'amber';
                        const badgeLabel =
                            status === 'published'
                                ? t('posts.type_published')
                                : status === 'scheduled'
                                  ? t('posts.scheduled_badge')
                                  : t('posts.draft_badge');
                        const thumb = (post.featured_image ?? '').trim();

                        return (
                            <TableRow
                                key={post.id}
                                className="group/list-row cursor-pointer hover:bg-zinc-950/5 dark:hover:bg-white/5"
                                tabIndex={0}
                                aria-label={t('dashboard.recent_edit_aria', { title })}
                                onClick={() => navigate(`/posts/${post.id}`)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        navigate(`/posts/${post.id}`);
                                    }
                                }}
                            >
                                <TableCell className="w-full max-w-0">
                                    <div className="flex min-w-0 items-center gap-3">
                                        {thumb !== '' ? (
                                            <FadeInImage
                                                src={thumb}
                                                alt=""
                                                className="size-9 shrink-0 rounded-lg object-cover"
                                            />
                                        ) : null}
                                        <div className="min-w-0">
                                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                <span className="truncate font-medium text-zinc-950 dark:text-white">
                                                    {title}
                                                </span>
                                                <Badge color={badgeColor} data-publish-status={status}>
                                                    {badgeLabel}
                                                </Badge>
                                                {post.has_pending_changes ? (
                                                    <Badge color="zinc">{t('dashboard.pending_badge')}</Badge>
                                                ) : null}
                                            </div>
                                            <Text className="mt-1 line-clamp-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                                {status === 'published'
                                                    ? t('dashboard.recent_views', {
                                                          count: post.views_count.toLocaleString(),
                                                      })
                                                    : t('dashboard.recent_continue')}
                                            </Text>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="w-px whitespace-nowrap">
                                    <ListRowEnd date={formatListDate(post.updated_at)}>
                                        {status === 'published' ? (
                                            <ListRowActionLink
                                                href={`/posts/${post.id}/stats`}
                                                label={t('dashboard.recent_stats_aria', { title })}
                                            >
                                                <IconChartBar className="size-5" aria-hidden="true" />
                                            </ListRowActionLink>
                                        ) : null}
                                    </ListRowEnd>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </section>
    );
}
