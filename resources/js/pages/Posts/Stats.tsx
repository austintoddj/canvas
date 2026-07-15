import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import DailyBarChart from '@/components/analytics/DailyBarChart';
import StatCard from '@/components/analytics/StatCard';
import { Button } from '@/components/button';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/description-list';
import { Divider } from '@/components/divider';
import { Heading, Subheading } from '@/components/heading';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { ApiError } from '@/lib/api';
import { postsApi } from '@/lib/api/posts';
import { parseDailyGraph, rankedEntries } from '@/lib/analytics';
import type { PostStatsResponse } from '@/types/api';

function RankedList({
    entries,
    suffix,
    emptyLabel,
}: {
    entries: [string, string][];
    suffix?: string;
    emptyLabel: string;
}) {
    if (entries.length === 0) {
        return <Text className="text-sm text-zinc-500">{emptyLabel}</Text>;
    }

    return (
        <DescriptionList>
            {entries.map(([label, value]) => (
                <div key={label} className="contents">
                    <DescriptionTerm>{label}</DescriptionTerm>
                    <DescriptionDetails>
                        {value}
                        {suffix ?? ''}
                    </DescriptionDetails>
                </div>
            ))}
        </DescriptionList>
    );
}

export default function PostsStats() {
    const { t } = useCanvas();
    const { id } = useParams();
    const postId = id ?? null;
    const [stats, setStats] = useState<PostStatsResponse | null>(null);
    const [loading, setLoading] = useState(postId !== null);
    const [error, setError] = useState<string | null>(postId === null ? t('stats.post_not_found') : null);

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
            .catch((error: unknown) => {
                if (!cancelled) {
                    const notFound = error instanceof ApiError && error.status === 404;
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

    if (loading) {
        return (
            <div className="px-8 py-12">
                <Text className="text-zinc-500">{t('stats.loading')}</Text>
            </div>
        );
    }

    if (error !== null || stats === null) {
        return (
            <div className="space-y-4">
                <ErrorText>{error ?? t('stats.post_not_found')}</ErrorText>
            </div>
        );
    }

    const title = stats.post.title.trim() === '' ? t('editor.untitled_post') : stats.post.title;
    const viewsSeries = parseDailyGraph(stats.graph.views);
    const visitsSeries = parseDailyGraph(stats.graph.visits);

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
                <Button href={`/posts/${stats.post.id}`} plain aria-label={t('stats.back_to_post')}>
                    <ArrowLeftIcon data-slot="icon" />
                </Button>
                <div>
                    <Heading>{title}</Heading>
                    <PageDescription>{t('stats.description')}</PageDescription>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label={t('stats.views_month')}
                    value={stats.monthlyViews}
                    change={stats.monthOverMonthViews}
                />
                <StatCard
                    label={t('stats.visits_month')}
                    value={stats.monthlyVisits}
                    change={stats.monthOverMonthVisits}
                />
                <StatCard label={t('stats.all_time_views')} value={stats.totalViews} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <DailyBarChart title={t('stats.views_30')} data={viewsSeries} />
                <DailyBarChart title={t('stats.visits_30')} data={visitsSeries} />
            </div>

            <Divider />

            <div className="grid gap-8 lg:grid-cols-3">
                <div>
                    <Subheading>{t('stats.reading_time')}</Subheading>
                    <Text className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{stats.readTime}</Text>
                    <Subheading className="mt-6">{t('stats.popular_times')}</Subheading>
                    <div className="mt-3">
                        <RankedList
                            entries={rankedEntries(stats.popularReadingTimes)}
                            emptyLabel={t('stats.no_data')}
                        />
                    </div>
                </div>
                <div>
                    <Subheading>{t('stats.top_referers')}</Subheading>
                    <div className="mt-3">
                        <RankedList entries={rankedEntries(stats.topReferers)} emptyLabel={t('stats.no_data')} />
                    </div>
                </div>
                <div>
                    <Subheading>{t('stats.top_browsers')}</Subheading>
                    <div className="mt-3">
                        <RankedList entries={rankedEntries(stats.topBrowsers)} emptyLabel={t('stats.no_data')} />
                    </div>
                </div>
            </div>
        </div>
    );
}
