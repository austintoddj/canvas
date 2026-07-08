import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import DailyBarChart from '@/components/analytics/DailyBarChart';
import StatCard from '@/components/analytics/StatCard';
import { Button } from '@/components/button';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/description-list';
import { Divider } from '@/components/divider';
import { Heading, Subheading } from '@/components/heading';
import { Text } from '@/components/text';
import { postsApi } from '@/lib/api/posts';
import { parseDailyGraph, rankedEntries } from '@/lib/analytics';
import type { PostStatsResponse } from '@/types/api';

function RankedList({ entries, suffix }: { entries: [string, string][]; suffix?: string }) {
    if (entries.length === 0) {
        return <Text className="text-sm text-zinc-500">No data yet.</Text>;
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
    const { id } = useParams();
    const postId = id ?? null;
    const [stats, setStats] = useState<PostStatsResponse | null>(null);
    const [loading, setLoading] = useState(postId !== null);
    const [error, setError] = useState<string | null>(postId === null ? 'Post not found.' : null);

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
            .catch(() => {
                if (!cancelled) {
                    setError('Unable to load post stats.');
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
    }, [postId]);

    if (loading) {
        return (
            <div className="px-8 py-12">
                <Text className="text-zinc-500">Loading stats…</Text>
            </div>
        );
    }

    if (error !== null || stats === null) {
        return (
            <div className="px-8 py-12">
                <Text className="text-red-600 dark:text-red-500">{error ?? 'Post not found.'}</Text>
            </div>
        );
    }

    const title = stats.post.title.trim() === '' ? 'Untitled post' : stats.post.title;
    const viewsSeries = parseDailyGraph(stats.graph.views);
    const visitsSeries = parseDailyGraph(stats.graph.visits);

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-3">
                <Button href={`/posts/${stats.post.id}`} plain aria-label="Back to post">
                    <ArrowLeftIcon data-slot="icon" />
                </Button>
                <div>
                    <Heading>{title}</Heading>
                    <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Post analytics</Text>
                </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label="Views this month" value={stats.monthlyViews} change={stats.monthOverMonthViews} />
                <StatCard label="Visits this month" value={stats.monthlyVisits} change={stats.monthOverMonthVisits} />
                <StatCard label="All-time views" value={stats.totalViews} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <DailyBarChart title="Views (last 30 days)" data={viewsSeries} />
                <DailyBarChart title="Visits (last 30 days)" data={visitsSeries} />
            </div>

            <Divider className="mt-10" />

            <div className="mt-10 grid gap-10 lg:grid-cols-2">
                <section>
                    <Subheading>Top referers</Subheading>
                    <div className="mt-4">
                        <RankedList entries={rankedEntries(stats.topReferers)} />
                    </div>
                </section>

                <section>
                    <Subheading>Top browsers</Subheading>
                    <div className="mt-4">
                        <RankedList entries={rankedEntries(stats.topBrowsers)} />
                    </div>
                </section>

                <section>
                    <Subheading>Popular reading times</Subheading>
                    <div className="mt-4">
                        <RankedList entries={rankedEntries(stats.popularReadingTimes)} suffix="%" />
                    </div>
                </section>

                <section>
                    <Subheading>Reading time</Subheading>
                    <Text className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">{stats.readTime}</Text>
                </section>
            </div>
        </div>
    );
}
