import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import MetricHero from '@/components/analytics/MetricHero';
import RankedBarList from '@/components/analytics/RankedBarList';
import StatCard from '@/components/analytics/StatCard';
import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { Heading } from '@/components/heading';
import { Skeleton } from '@/components/Skeleton';
import { PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { isInitialLoading, isRefreshing } from '@/lib/async-ui';
import { ApiError } from '@/lib/api';
import { postsApi } from '@/lib/api/posts';
import { parseDailyGraph, rankedWithShare } from '@/lib/analytics';
import type { PostStatsResponse } from '@/types/api';
import { IconArrowLeft } from '@tabler/icons-react';

function StatsSkeleton() {
    return (
        <div className="space-y-8" aria-hidden="true">
            <Skeleton className="h-72 w-full" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        </div>
    );
}

export default function PostsStats() {
    const { t } = useCanvas();
    const { id } = useParams();
    const postId = id ?? null;
    const [stats, setStats] = useState<PostStatsResponse | null>(null);
    const [loading, setLoading] = useState(postId !== null);
    const [error, setError] = useState<string | null>(postId === null ? t('stats.post_not_found') : null);

    const statsPageTitle =
        stats === null
            ? t('stats.title')
            : `${stats.post.title.trim() === '' ? t('editor.untitled_post') : stats.post.title.trim()} ― ${t('stats.title')}`;
    useDocumentTitle(statsPageTitle);

    useEffect(() => {
        if (postId === null) {
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        queueMicrotask(() => {
            if (!cancelled) {
                setLoading(true);
                setError(null);
            }
        });

        postsApi
            .stats(postId, controller.signal)
            .then((response) => {
                if (!cancelled) {
                    setStats(response);
                }
            })
            .catch((caught: unknown) => {
                if (!cancelled) {
                    const notFound = caught instanceof ApiError && caught.status === 404;
                    setError(notFound ? t('stats.published_only') : t('stats.load_error'));
                    setStats(null);
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
    }, [postId, t]);

    const viewsSeries = useMemo(() => (stats ? parseDailyGraph(stats.graph.views) : []), [stats]);
    const visitsSeries = useMemo(() => (stats ? parseDailyGraph(stats.graph.visits) : []), [stats]);

    const referers = useMemo(() => (stats ? rankedWithShare(stats.topReferers, 50) : []), [stats]);
    const browsers = useMemo(() => (stats ? rankedWithShare(stats.topBrowsers, 0) : []), [stats]);
    const popularTimes = useMemo(
        () => (stats ? rankedWithShare(stats.popularReadingTimes, 0, { valuesAreShares: true }) : []),
        [stats]
    );

    const itemCount = stats === null ? 0 : 1;
    const showInitialSkeleton = isInitialLoading(loading, itemCount);
    const refreshing = isRefreshing(loading, itemCount);
    const { animateContent } = useAsyncReveal(loading, itemCount);
    const changeSuffix = t('stats.vs_last_month');

    const title = stats === null ? null : stats.post.title.trim() === '' ? t('editor.untitled_post') : stats.post.title;

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    href={stats ? `/posts/${stats.post.id}` : postId ? `/posts/${postId}` : '/posts'}
                    plain
                    aria-label={t('stats.back_to_post')}
                >
                    <IconArrowLeft data-slot="icon" />
                </Button>
                <div className="min-w-0">
                    {title ? <Heading>{title}</Heading> : <Skeleton className="h-8 w-48 max-w-full" />}
                    <PageDescription>{t('stats.description')}</PageDescription>
                </div>
            </div>

            {error && !loading ? <ErrorText>{error}</ErrorText> : null}

            {showInitialSkeleton ? (
                <StatsSkeleton />
            ) : stats ? (
                <ContentReveal className="space-y-8" busy={refreshing} animate={animateContent}>
                    <MetricHero
                        label={t('stats.views_month')}
                        value={stats.monthlyViews}
                        change={stats.monthOverMonthViews}
                        changeSuffix={changeSuffix}
                        series={viewsSeries}
                        caption={t('stats.last_30_days')}
                        emptyLabel={t('stats.no_data')}
                    />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard
                            label={t('stats.visits_month')}
                            value={stats.monthlyVisits}
                            change={stats.monthOverMonthVisits}
                            changeSuffix={changeSuffix}
                            sparkline={visitsSeries}
                        />
                        <StatCard label={t('stats.all_time_views')} value={stats.totalViews} />
                        <StatCard label={t('stats.reading_time')} valueLabel={stats.readTime} />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <RankedBarList
                            title={t('stats.top_referers')}
                            entries={referers}
                            emptyLabel={t('stats.no_data')}
                            iconKind="referer"
                            previewLimit={5}
                            searchPlaceholder={t('stats.search_list')}
                            exportLabel={t('stats.export_csv')}
                            closeLabel={t('stats.close_list')}
                            viewAllLabel={t('stats.view_all')}
                            valueColumnLabel={t('stats.metric_views')}
                            csvFilename="referers.csv"
                        />
                        <RankedBarList
                            title={t('stats.top_browsers')}
                            entries={browsers}
                            emptyLabel={t('stats.no_data')}
                            iconKind="browser"
                            previewLimit={5}
                            searchPlaceholder={t('stats.search_list')}
                            exportLabel={t('stats.export_csv')}
                            closeLabel={t('stats.close_list')}
                            viewAllLabel={t('stats.view_all')}
                            valueColumnLabel={t('stats.metric_views')}
                            csvFilename="browsers.csv"
                        />
                        <RankedBarList
                            title={t('stats.popular_times')}
                            entries={popularTimes}
                            emptyLabel={t('stats.no_data')}
                            iconKind="time"
                            previewLimit={5}
                            searchPlaceholder={t('stats.search_list')}
                            exportLabel={t('stats.export_csv')}
                            closeLabel={t('stats.close_list')}
                            viewAllLabel={t('stats.view_all')}
                            valueColumnLabel={t('stats.share')}
                            csvFilename="reading-times.csv"
                        />
                    </div>
                </ContentReveal>
            ) : null}
        </div>
    );
}
