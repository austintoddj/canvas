import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { ContentReveal } from '@/components/ContentReveal';
import { PageHeader } from '@/components/PageHeader';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { Skeleton } from '@/components/Skeleton';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useAsyncReveal } from '@/hooks/useAsyncReveal';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePermissions } from '@/hooks/usePermissions';
import { isInitialLoading, isRefreshing } from '@/lib/async-ui';
import { calendarApi } from '@/lib/api/calendar';
import {
    addMonths,
    buildMonthGrid,
    formatMonthTitle,
    formatYearMonth,
    gridDateRange,
    groupPostsByDate,
    parseCalendarScope,
    parseYearMonth,
    postsInMonth,
    weekdayLabels,
    weekStartsOnForLocale,
    type CalendarScope,
    type YearMonth,
} from '@/lib/calendar/month';
import { formatListDate } from '@/lib/format-list-date';
import { cn } from '@/lib/utils';
import type { CalendarPost } from '@/types/api';
import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';

/** Title chips on sm+; mobile uses compact status dots instead. */
const CELL_PREVIEW_LIMIT = 3;
const CELL_DOT_LIMIT = 4;

function CalendarSkeleton() {
    return (
        <div className="space-y-3" aria-hidden="true">
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-canvas-border dark:border-canvas-border-dark">
                {Array.from({ length: 35 }, (_, i) => (
                    <Skeleton key={i} className="h-24 rounded-none sm:h-28" />
                ))}
            </div>
        </div>
    );
}

function updateSearchParams(
    current: URLSearchParams,
    patch: { month?: YearMonth; scope?: CalendarScope; day?: string | null }
): URLSearchParams {
    const next = new URLSearchParams(current);
    const now = new Date();
    const currentMonth = parseYearMonth(current.get('month'), now);

    if (patch.month !== undefined) {
        const key = formatYearMonth(patch.month);
        const defaultKey = formatYearMonth({ year: now.getFullYear(), month: now.getMonth() });

        if (key === defaultKey) {
            next.delete('month');
        } else {
            next.set('month', key);
        }
    }

    if (patch.scope !== undefined) {
        if (patch.scope === 'all') {
            next.set('scope', 'all');
        } else {
            next.delete('scope');
        }
    }

    if (patch.day !== undefined) {
        if (patch.day === null || patch.day === '') {
            next.delete('day');
        } else {
            // Drop day when navigating months if it falls outside the visible intent —
            // callers pass null to clear, or a Y-m-d to select.
            const monthKey = patch.month !== undefined ? formatYearMonth(patch.month) : formatYearMonth(currentMonth);

            if (patch.day.startsWith(monthKey)) {
                next.set('day', patch.day);
            } else {
                next.delete('day');
            }
        }
    }

    return next;
}

export default function CalendarIndex() {
    const navigate = useNavigate();
    const { t, user } = useCanvas();
    const { canViewAllPosts } = usePermissions();
    const [searchParams, setSearchParams] = useSearchParams();

    const locale = user.canvas?.locale;
    const weekStartsOn = weekStartsOnForLocale(locale);
    const monthParam = searchParams.get('month');
    const yearMonth = useMemo(() => parseYearMonth(monthParam), [monthParam]);
    const scope = parseCalendarScope(searchParams.get('scope'));
    const effectiveScope: CalendarScope = canViewAllPosts ? scope : 'user';
    const selectedDay = searchParams.get('day');

    const cells = useMemo(() => buildMonthGrid(yearMonth, weekStartsOn), [yearMonth, weekStartsOn]);
    const range = useMemo(() => gridDateRange(cells), [cells]);
    const weekdays = useMemo(() => weekdayLabels(locale, weekStartsOn), [locale, weekStartsOn]);
    const monthTitle = useMemo(() => formatMonthTitle(yearMonth, locale), [yearMonth, locale]);

    const [posts, setPosts] = useState<CalendarPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    /** Bumped on “Today” so the today marker remounts and re-runs its one-shot pulse. */
    const [todayPulseKey, setTodayPulseKey] = useState(0);

    useDocumentTitle(t('calendar.title'));

    const queryKey = `${range.from}|${range.to}|${effectiveScope}`;

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        queueMicrotask(() => {
            if (!cancelled) {
                setLoading(true);
                setError(null);
            }
        });

        calendarApi
            .posts(
                {
                    from: range.from,
                    to: range.to,
                    scope: effectiveScope === 'all' ? 'all' : undefined,
                },
                controller.signal
            )
            .then((data) => {
                if (!cancelled) {
                    setPosts(data.posts);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(t('calendar.load_error'));
                    setPosts([]);
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
    }, [queryKey, range.from, range.to, effectiveScope, t]);

    const byDate = useMemo(() => groupPostsByDate(posts), [posts]);
    const inMonthPosts = useMemo(() => postsInMonth(posts, yearMonth), [posts, yearMonth]);
    // Use full fetch size for skeleton/refresh so month switches keep the grid
    // instead of flashing skeleton when the target month is empty.
    const fetchCount = posts.length;
    const showInitialSkeleton = isInitialLoading(loading, fetchCount);
    const refreshing = isRefreshing(loading, fetchCount);
    const { animateContent } = useAsyncReveal(loading, fetchCount, queryKey);
    const monthEmpty = !loading && inMonthPosts.length === 0;

    const selectedPosts = selectedDay ? (byDate.get(selectedDay) ?? []) : [];
    const dayPanelRef = useRef<HTMLElement | null>(null);

    function setMonth(next: YearMonth) {
        setSearchParams((current) => updateSearchParams(current, { month: next, day: null }), {
            replace: true,
        });
    }

    function setScope(next: CalendarScope) {
        setSearchParams((current) => updateSearchParams(current, { scope: next }), { replace: true });
    }

    function selectDay(date: string) {
        setSearchParams(
            (current) =>
                updateSearchParams(current, {
                    day: selectedDay === date ? null : date,
                    month: yearMonth,
                }),
            { replace: true }
        );
    }

    function clearDay() {
        setSearchParams((current) => updateSearchParams(current, { day: null }), { replace: true });
    }

    function goToday() {
        const now = new Date();
        setSearchParams(
            (current) =>
                updateSearchParams(current, {
                    month: { year: now.getFullYear(), month: now.getMonth() },
                    day: null,
                }),
            { replace: true }
        );
        setTodayPulseKey((key) => key + 1);
    }

    function handleGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setMonth(addMonths(yearMonth, -1));
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            setMonth(addMonths(yearMonth, 1));
            return;
        }

        if (event.key === 'Escape' && selectedDay) {
            event.preventDefault();
            clearDay();
        }
    }

    useEffect(() => {
        if (!selectedDay || !dayPanelRef.current) {
            return;
        }

        dayPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [selectedDay]);

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('calendar.title')}
                actions={
                    <Button href="/posts/new" outline>
                        <IconPlus data-slot="icon" />
                        {t('posts.new')}
                    </Button>
                }
            >
                <PageDescription>{t('calendar.description')}</PageDescription>
            </PageHeader>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                        <Button
                            plain
                            aria-label={t('calendar.prev_month')}
                            onClick={() => setMonth(addMonths(yearMonth, -1))}
                        >
                            <IconChevronLeft data-slot="icon" />
                        </Button>
                        <Button
                            plain
                            aria-label={t('calendar.next_month')}
                            onClick={() => setMonth(addMonths(yearMonth, 1))}
                        >
                            <IconChevronRight data-slot="icon" />
                        </Button>
                    </div>
                    <h2 className="min-w-[10rem] text-lg font-semibold tracking-tight text-canvas-fg dark:text-canvas-fg-dark">
                        {monthTitle}
                    </h2>
                    <Button outline onClick={goToday}>
                        {t('calendar.today')}
                    </Button>
                </div>

                {canViewAllPosts ? (
                    <PillNav
                        value={effectiveScope}
                        onChange={(value) => setScope(value as CalendarScope)}
                        aria-label={t('calendar.scope_label')}
                    >
                        <PillNavItem value="user">{t('calendar.scope_mine')}</PillNavItem>
                        <PillNavItem value="all">{t('calendar.scope_all')}</PillNavItem>
                    </PillNav>
                ) : null}
            </div>

            {error ? <ErrorText>{error}</ErrorText> : null}

            {showInitialSkeleton ? (
                <CalendarSkeleton />
            ) : (
                <ContentReveal busy={refreshing} animate={animateContent}>
                    <div className="space-y-6">
                        {monthEmpty ? (
                            <p
                                className="text-sm text-canvas-muted dark:text-canvas-muted-dark"
                                data-calendar-month-empty="true"
                            >
                                <span className="font-medium text-canvas-fg dark:text-canvas-fg-dark">
                                    {t('calendar.empty_title')}
                                </span>
                                <span className="mx-1.5 text-canvas-border dark:text-canvas-border-dark">·</span>
                                {t('calendar.empty_blurb')}
                            </p>
                        ) : null}

                        <div
                            className="overflow-hidden rounded-2xl border border-canvas-border bg-canvas-border dark:border-canvas-border-dark dark:bg-canvas-border-dark"
                            data-calendar-grid="true"
                            role="grid"
                            aria-label={monthTitle}
                            tabIndex={0}
                            onKeyDown={handleGridKeyDown}
                        >
                            <div
                                className="grid grid-cols-7 gap-px border-b border-canvas-border bg-zinc-50 dark:border-canvas-border-dark dark:bg-zinc-900/60"
                                role="row"
                            >
                                {weekdays.map((label) => (
                                    <div
                                        key={label}
                                        role="columnheader"
                                        className="px-1 py-2 text-center text-[11px] font-medium text-canvas-muted sm:px-2 sm:text-xs dark:text-canvas-muted-dark"
                                    >
                                        {label}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-px" role="rowgroup">
                                {cells.map((cell) => {
                                    const dayPosts = byDate.get(cell.date) ?? [];
                                    const isSelected = selectedDay === cell.date;
                                    const preview = dayPosts.slice(0, CELL_PREVIEW_LIMIT);
                                    const overflow = dayPosts.length - preview.length;
                                    const dots = dayPosts.slice(0, CELL_DOT_LIMIT);
                                    const dotOverflow = dayPosts.length - dots.length;
                                    const pulseToday = cell.isToday && todayPulseKey > 0;

                                    return (
                                        <button
                                            key={cell.date}
                                            type="button"
                                            role="gridcell"
                                            onClick={() => selectDay(cell.date)}
                                            data-calendar-day={cell.date}
                                            data-selected={isSelected ? 'true' : undefined}
                                            aria-selected={isSelected}
                                            className={cn(
                                                'flex min-h-16 flex-col gap-0.5 bg-white p-1 text-left transition-colors sm:min-h-28 sm:gap-1 sm:p-1.5',
                                                'hover:bg-zinc-50 focus:outline-hidden focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-blue-500',
                                                'dark:bg-zinc-950 dark:hover:bg-zinc-900/80',
                                                !cell.inMonth && 'bg-zinc-50/80 dark:bg-zinc-950/50',
                                                isSelected &&
                                                    'relative z-10 ring-2 ring-inset ring-blue-500 dark:ring-blue-400'
                                            )}
                                        >
                                            <span
                                                key={pulseToday ? `today-pulse-${todayPulseKey}` : `day-${cell.date}`}
                                                data-calendar-today={cell.isToday ? 'true' : undefined}
                                                data-calendar-today-pulse={pulseToday ? 'true' : undefined}
                                                className={cn(
                                                    'inline-flex size-6 items-center justify-center rounded-full text-[11px] font-medium sm:size-7 sm:text-xs',
                                                    cell.isToday && 'bg-blue-600 text-white dark:bg-blue-500',
                                                    pulseToday && 'canvas-calendar-today-pulse',
                                                    !cell.isToday &&
                                                        cell.inMonth &&
                                                        'text-canvas-fg dark:text-canvas-fg-dark',
                                                    !cell.isToday && !cell.inMonth && 'text-zinc-400 dark:text-zinc-600'
                                                )}
                                            >
                                                {cell.day}
                                            </span>

                                            {/* Mobile: compact status dots so multi-post days stay scannable. */}
                                            {dayPosts.length > 0 ? (
                                                <div
                                                    className="mt-auto flex flex-wrap items-center gap-0.5 px-0.5 sm:hidden"
                                                    data-calendar-day-dots="true"
                                                    aria-hidden="true"
                                                >
                                                    {dots.map((post) => (
                                                        <span
                                                            key={post.id}
                                                            className={cn(
                                                                'size-1.5 shrink-0 rounded-full',
                                                                post.status === 'scheduled'
                                                                    ? 'bg-blue-500'
                                                                    : 'bg-emerald-500',
                                                                !cell.inMonth && 'opacity-50'
                                                            )}
                                                        />
                                                    ))}
                                                    {dotOverflow > 0 ? (
                                                        <span className="text-[9px] font-medium leading-none text-canvas-muted dark:text-canvas-muted-dark">
                                                            +{dotOverflow}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ) : null}

                                            {/* sm+: title chips with denser packing. */}
                                            <div className="hidden min-h-0 flex-1 flex-col gap-0.5 sm:flex">
                                                {preview.map((post) => {
                                                    const title = (post.title ?? '').trim() || t('common.untitled');

                                                    return (
                                                        <span
                                                            key={post.id}
                                                            data-calendar-chip={post.status}
                                                            className={cn(
                                                                'truncate rounded px-1 py-px text-[10px] font-medium leading-tight sm:text-[11px]',
                                                                post.status === 'scheduled'
                                                                    ? 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                                                                    : 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
                                                                !cell.inMonth && 'opacity-60'
                                                            )}
                                                            title={title}
                                                        >
                                                            {title}
                                                        </span>
                                                    );
                                                })}
                                                {overflow > 0 ? (
                                                    <span className="px-1 text-[10px] font-medium text-canvas-muted dark:text-canvas-muted-dark">
                                                        {t('calendar.more', { count: overflow })}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedDay ? (
                            <section
                                ref={dayPanelRef}
                                className="space-y-3 rounded-2xl border border-canvas-border p-4 sm:p-5 dark:border-canvas-border-dark"
                                data-calendar-day-panel="true"
                                aria-label={selectedDay}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="text-sm font-semibold text-canvas-fg dark:text-canvas-fg-dark">
                                        {new Intl.DateTimeFormat(locale || undefined, {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        }).format(new Date(selectedDay + 'T12:00:00'))}
                                    </h3>
                                    <Text className="text-xs">
                                        {selectedPosts.length === 1
                                            ? t('common.post_count', { count: 1 })
                                            : t('common.posts_count', { count: selectedPosts.length })}
                                    </Text>
                                </div>

                                {selectedPosts.length === 0 ? (
                                    <Text className="text-sm">{t('calendar.no_posts_day')}</Text>
                                ) : (
                                    <ul className="divide-y divide-canvas-border dark:divide-canvas-border-dark">
                                        {selectedPosts.map((post) => {
                                            const title = (post.title ?? '').trim() || t('common.untitled');
                                            const badgeColor = post.status === 'scheduled' ? 'blue' : 'green';
                                            const badgeLabel =
                                                post.status === 'scheduled'
                                                    ? t('calendar.scheduled')
                                                    : t('calendar.published');

                                            return (
                                                <li key={post.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/posts/${post.id}`)}
                                                        className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-zinc-50 focus:outline-hidden focus-visible:bg-zinc-50 dark:hover:bg-white/5 dark:focus-visible:bg-white/5"
                                                    >
                                                        {post.featured_image ? (
                                                            <img
                                                                src={post.featured_image}
                                                                alt=""
                                                                className="size-10 shrink-0 rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <span className="size-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                                                        )}
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate text-sm font-medium text-canvas-fg dark:text-canvas-fg-dark">
                                                                {title}
                                                            </span>
                                                            <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-canvas-muted dark:text-canvas-muted-dark">
                                                                <span>{formatListDate(post.published_at)}</span>
                                                                {post.user?.name ? (
                                                                    <span className="truncate">{post.user.name}</span>
                                                                ) : null}
                                                            </span>
                                                        </span>
                                                        <Badge color={badgeColor}>{badgeLabel}</Badge>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </section>
                        ) : null}
                    </div>
                </ContentReveal>
            )}
        </div>
    );
}
