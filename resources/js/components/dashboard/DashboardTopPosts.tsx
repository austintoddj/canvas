import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/button';
import { Dialog, DialogActions, DialogBody, DialogTitle } from '@/components/dialog';
import { Subheading } from '@/components/heading';
import { Link } from '@/components/link';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { useFinePointerHover } from '@/hooks/useFinePointerHover';
import { DASHBOARD_RANKED_PREVIEW } from '@/lib/dashboard';
import type { DashboardTopPost } from '@/types/api';
import { IconArrowsMaximize } from '@tabler/icons-react';

type DashboardTopPostsProps = {
    posts: DashboardTopPost[];
    rangeLabel?: string;
    previewLimit?: number;
};

function TopPostRows({ posts, total }: { posts: DashboardTopPost[]; total: number }) {
    const { t } = useCanvas();

    return (
        <ol className="space-y-1">
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
                            className="relative flex min-w-0 items-center gap-2 px-2.5 py-2 text-sm focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500 sm:gap-3"
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
    );
}

export function DashboardTopPosts({
    posts,
    rangeLabel,
    previewLimit = DASHBOARD_RANKED_PREVIEW,
}: DashboardTopPostsProps) {
    const { t } = useCanvas();
    const fineHover = useFinePointerHover();
    const reducedMotion = useReducedMotion() === true;
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState(false);
    const total = useMemo(() => posts.reduce((sum, post) => sum + post.views, 0), [posts]);
    const preview = posts.slice(0, previewLimit);
    const hasMore = posts.length > previewLimit;
    const pillVisible = hasMore && (!fineHover || hovered);

    function openDialog() {
        setOpen(true);
        setHovered(false);
    }

    return (
        <>
            <div
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
                className="relative flex h-full min-w-0 max-w-full flex-col overflow-hidden rounded-xl border border-zinc-950/10 p-5 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5"
                data-dashboard-top-posts="true"
            >
                <div className="shrink-0">
                    <Subheading level={3} className="text-sm/6">
                        {t('dashboard.most_viewed')}
                    </Subheading>
                    <Text className="mt-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                        {rangeLabel
                            ? t('dashboard.most_viewed_hint_range', { range: rangeLabel })
                            : t('dashboard.most_viewed_hint')}
                    </Text>
                </div>

                {posts.length === 0 ? (
                    <div className="mt-6 flex flex-1 flex-col justify-center">
                        <p className="text-sm font-medium text-zinc-950 dark:text-white">
                            {t('dashboard.most_viewed_empty_title')}
                        </p>
                        <Text className="mt-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                            {t('dashboard.most_viewed_empty_blurb')}
                        </Text>
                    </div>
                ) : (
                    <div className="relative mt-4 min-h-0 flex-1">
                        <TopPostRows posts={preview} total={total} />

                        {hasMore ? (
                            <div className="pointer-events-none absolute inset-x-0 bottom-1 z-10 flex justify-center">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        opacity: pillVisible ? 1 : 0,
                                        y: pillVisible ? 0 : 8,
                                        scale: pillVisible ? 1 : 0.96,
                                    }}
                                    transition={
                                        reducedMotion
                                            ? { duration: 0 }
                                            : {
                                                  type: 'tween',
                                                  duration: 0.22,
                                                  ease: [0.16, 1, 0.3, 1],
                                              }
                                    }
                                    className="will-change-transform"
                                    style={{ pointerEvents: pillVisible ? 'auto' : 'none' }}
                                >
                                    <button
                                        type="button"
                                        onClick={openDialog}
                                        tabIndex={pillVisible ? 0 : -1}
                                        className={clsx(
                                            'inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-lg shadow-zinc-950/10',
                                            'ring-1 ring-zinc-950/10 backdrop-blur-sm',
                                            'hover:bg-white hover:text-zinc-950',
                                            'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                                            'dark:bg-zinc-900/95 dark:text-zinc-200 dark:shadow-none dark:ring-white/15',
                                            'dark:hover:bg-zinc-800 dark:hover:text-white'
                                        )}
                                    >
                                        <IconArrowsMaximize className="size-3.5 shrink-0" aria-hidden="true" />
                                        {t('stats.view_all')}
                                    </button>
                                </motion.div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            <Dialog open={open} onClose={setOpen} size="lg">
                <DialogTitle>{t('dashboard.most_viewed')}</DialogTitle>
                <DialogBody className="mt-4">
                    <div className="max-h-[min(28rem,55vh)] overflow-y-auto pr-1">
                        <TopPostRows posts={posts} total={total} />
                    </div>
                </DialogBody>
                <DialogActions className="mt-6">
                    <Button outline onClick={() => setOpen(false)}>
                        {t('stats.close_list')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
