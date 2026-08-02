import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';

import AnalyticsEntryIcon from '@/components/analytics/AnalyticsEntryIcon';
import { Button } from '@/components/button';
import { Dialog, DialogActions, DialogBody, DialogTitle } from '@/components/dialog';
import { Subheading } from '@/components/heading';
import { Input, InputGroup } from '@/components/input';
import { Text } from '@/components/text';
import { useFinePointerHover } from '@/hooks/useFinePointerHover';
import { downloadCsv, rankedToCsv, type RankedShareEntry } from '@/lib/analytics';
import type { AnalyticsIconKind } from '@/lib/analytics-icons';
import { IconArrowsMaximize, IconFileSpreadsheet, IconSearch } from '@tabler/icons-react';

type RankedBarListProps = {
    title: string;
    entries: RankedShareEntry[];
    emptyLabel: string;
    iconKind?: AnalyticsIconKind;
    /** Rows shown on the card surface before expand. */
    previewLimit?: number;
    searchPlaceholder?: string;
    exportLabel?: string;
    closeLabel?: string;
    viewAllLabel?: string;
    valueColumnLabel?: string;
    csvFilename?: string;
    className?: string;
};

function RankedRows({
    entries,
    iconKind,
    startIndex = 0,
}: {
    entries: RankedShareEntry[];
    iconKind?: AnalyticsIconKind;
    startIndex?: number;
}) {
    return (
        <ol className="space-y-1">
            {entries.map((entry, index) => {
                const barWidth = Math.round(entry.share * 100);

                return (
                    <li key={entry.label} className="relative overflow-hidden rounded-lg">
                        <div
                            className="absolute inset-y-0 left-0 rounded-lg bg-blue-500/10 dark:bg-blue-400/15"
                            style={{ width: `${Math.max(barWidth, entry.share > 0 ? 2 : 0)}%` }}
                            aria-hidden="true"
                        />
                        <div className="relative flex min-w-0 items-center gap-2 px-2.5 py-2 text-sm sm:gap-3">
                            {iconKind ? (
                                <AnalyticsEntryIcon kind={iconKind} label={entry.label} />
                            ) : (
                                <span className="w-4 shrink-0 text-xs tabular-nums text-canvas-muted dark:text-canvas-muted-dark">
                                    {startIndex + index + 1}
                                </span>
                            )}
                            <span
                                className="min-w-0 flex-1 truncate font-medium text-zinc-950 dark:text-white"
                                title={entry.label}
                            >
                                {entry.label}
                            </span>
                            <span className="shrink-0 tabular-nums text-zinc-700 dark:text-zinc-300">
                                {entry.displayValue}
                            </span>
                            {entry.shareLabel ? (
                                <span className="w-10 shrink-0 text-right tabular-nums text-canvas-muted sm:w-12 dark:text-canvas-muted-dark">
                                    {entry.shareLabel}
                                </span>
                            ) : null}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

export default function RankedBarList({
    title,
    entries,
    emptyLabel,
    iconKind,
    previewLimit = 5,
    searchPlaceholder = 'Search',
    exportLabel = 'Export CSV',
    closeLabel = 'Close',
    viewAllLabel = 'View all',
    valueColumnLabel = 'Value',
    csvFilename,
    className,
}: RankedBarListProps) {
    const fineHover = useFinePointerHover();
    const reducedMotion = useReducedMotion() === true;
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [hovered, setHovered] = useState(false);

    const preview = entries.slice(0, previewLimit);
    const hasMore = entries.length > previewLimit;
    // Touch: always on. Desktop: only while the pointer is over the card.
    const pillVisible = hasMore && (!fineHover || hovered);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();

        if (needle === '') {
            return entries;
        }

        return entries.filter((entry) => entry.label.toLowerCase().includes(needle));
    }, [entries, query]);

    function handleExport() {
        const csv = rankedToCsv(entries, {
            label: title,
            value: valueColumnLabel,
            share: 'Share',
        });
        const name = csvFilename ?? `${title.toLowerCase().replace(/\s+/g, '-')}.csv`;
        downloadCsv(name, csv);
    }

    function openDialog() {
        setQuery('');
        setOpen(true);
        setHovered(false);
    }

    return (
        <>
            <div
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
                className={clsx(
                    // min-w-0 + overflow-hidden keep long labels (referer URLs) inside the chart column.
                    'relative flex h-full min-w-0 max-w-full flex-col overflow-hidden rounded-xl border border-zinc-950/10 p-5',
                    'dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5',
                    className
                )}
                data-ranked-bar-list="true"
            >
                <Subheading level={3} className="text-sm/6">
                    {title}
                </Subheading>

                {entries.length === 0 ? (
                    <Text className="mt-4 text-sm text-canvas-muted dark:text-canvas-muted-dark">{emptyLabel}</Text>
                ) : (
                    <div className="relative mt-4 min-h-0 flex-1">
                        <RankedRows entries={preview} iconKind={iconKind} />

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
                                        data-analytics-list-actions="true"
                                    >
                                        <IconArrowsMaximize className="size-3.5 shrink-0" aria-hidden="true" />
                                        {viewAllLabel}
                                    </button>
                                </motion.div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            <Dialog open={open} onClose={setOpen} size="lg">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <DialogTitle>{title}</DialogTitle>
                    <Text className="text-xs font-medium tracking-wide text-canvas-muted uppercase dark:text-canvas-muted-dark">
                        {valueColumnLabel}
                    </Text>
                </div>

                <DialogBody className="mt-4">
                    <InputGroup>
                        <IconSearch data-slot="icon" />
                        <Input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={searchPlaceholder}
                        />
                    </InputGroup>

                    <div className="mt-4 max-h-[min(28rem,55vh)] overflow-y-auto pr-1">
                        {filtered.length === 0 ? (
                            <Text className="py-8 text-center text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                {emptyLabel}
                            </Text>
                        ) : (
                            <RankedRows entries={filtered} iconKind={iconKind} />
                        )}
                    </div>
                </DialogBody>

                <DialogActions className="mt-6">
                    <Button plain onClick={handleExport}>
                        <IconFileSpreadsheet data-slot="icon" />
                        {exportLabel}
                    </Button>
                    <Button outline onClick={() => setOpen(false)}>
                        {closeLabel}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
