import { Link } from '@/components/link';
import { Subheading } from '@/components/heading';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import type { DashboardTopPost } from '@/types/api';

type DashboardTopPostsProps = {
    posts: DashboardTopPost[];
};

export function DashboardTopPosts({ posts }: DashboardTopPostsProps) {
    const { t } = useCanvas();
    const total = posts.reduce((sum, post) => sum + post.views, 0);

    return (
        <div
            className="flex h-full flex-col rounded-xl border border-zinc-950/10 p-5 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5"
            data-dashboard-top-posts="true"
        >
            <div className="shrink-0">
                <Subheading level={3} className="text-sm/6">
                    {t('dashboard.top_posts')}
                </Subheading>
                <Text className="mt-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                    {t('dashboard.top_posts_hint')}
                </Text>
            </div>

            {posts.length === 0 ? (
                <Text className="mt-4 text-sm text-canvas-muted dark:text-canvas-muted-dark">{t('stats.no_data')}</Text>
            ) : (
                <ol className="mt-4 min-h-0 flex-1 space-y-1">
                    {posts.map((post, index) => {
                        const rawTitle = (post.title ?? '').trim();
                        const title = rawTitle === '' ? t('editor.untitled_post') : rawTitle;
                        const share = total > 0 ? post.views / total : 0;
                        const barWidth = Math.round(share * 100);

                        return (
                            <li key={post.id} className="relative overflow-hidden rounded-lg">
                                <div
                                    className="absolute inset-y-0 left-0 rounded-lg bg-blue-500/10 dark:bg-blue-400/15"
                                    style={{ width: `${Math.max(barWidth, share > 0 ? 2 : 0)}%` }}
                                    aria-hidden="true"
                                />
                                <Link
                                    href={`/posts/${post.id}/stats`}
                                    className="relative flex items-center gap-3 px-2.5 py-2 text-sm focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500"
                                >
                                    <span className="w-4 shrink-0 text-xs tabular-nums text-canvas-muted dark:text-canvas-muted-dark">
                                        {index + 1}
                                    </span>
                                    <span
                                        className="min-w-0 flex-1 truncate font-medium text-zinc-950 dark:text-white"
                                        title={title}
                                    >
                                        {title}
                                    </span>
                                    <span className="shrink-0 tabular-nums text-zinc-700 dark:text-zinc-300">
                                        {post.views.toLocaleString()}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ol>
            )}
        </div>
    );
}
