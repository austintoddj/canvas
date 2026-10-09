import clsx from 'clsx';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
    Dropdown,
    DropdownButton,
    DropdownDivider,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
} from '@/components/dropdown';
import { useCanvas } from '@/hooks/useCanvas';
import { fitMediaTagRail, MEDIA_TAG_RAIL_GAP_PX, visibleMediaTags } from '@/lib/media/tag-rail';
import type { MediaTag } from '@/types/api';
import { IconDots, IconPlus } from '@tabler/icons-react';

type MediaTagRailProps = {
    tags: MediaTag[];
    allCount: number;
    untaggedCount: number;
    selectedTagId: string | null;
    untagged: boolean;
    canManage: boolean;
    onSelectAll: () => void;
    onSelectUntagged: () => void;
    onSelectTag: (tag: MediaTag) => void;
    onCreate?: () => void;
    onRename?: (tag: MediaTag) => void;
    onDelete?: (tag: MediaTag) => void;
};

type MeasuredRail = {
    available: number;
    gap: number;
    fixedWidths: number[];
    menuWidth: number;
    widthById: Map<string, number>;
};

const UNMEASURED: MeasuredRail = {
    available: 0,
    gap: MEDIA_TAG_RAIL_GAP_PX,
    fixedWidths: [],
    menuWidth: 0,
    widthById: new Map(),
};

function tagPillClass(selected: boolean, shrink: boolean): string {
    return clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-medium whitespace-nowrap transition',
        'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        shrink ? 'min-w-0 shrink overflow-hidden' : 'shrink-0',
        selected
            ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
            : 'bg-zinc-950/5 text-zinc-700 hover:bg-zinc-950/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15'
    );
}

function elementWidth(node: HTMLElement | null): number {
    return node === null ? 0 : Math.ceil(node.getBoundingClientRect().width);
}

function measuredEqual(current: MeasuredRail, next: MeasuredRail): boolean {
    if (
        current.available !== next.available ||
        current.gap !== next.gap ||
        current.menuWidth !== next.menuWidth ||
        current.fixedWidths.length !== next.fixedWidths.length ||
        current.widthById.size !== next.widthById.size
    ) {
        return false;
    }

    for (let index = 0; index < current.fixedWidths.length; index += 1) {
        if (current.fixedWidths[index] !== next.fixedWidths[index]) {
            return false;
        }
    }

    for (const [id, width] of current.widthById) {
        if (next.widthById.get(id) !== width) {
            return false;
        }
    }

    return true;
}

export function MediaTagRail({
    tags,
    allCount,
    untaggedCount,
    selectedTagId,
    untagged,
    canManage,
    onSelectAll,
    onSelectUntagged,
    onSelectTag,
    onCreate,
    onRename,
    onDelete,
}: MediaTagRailProps) {
    const { t } = useCanvas();
    const navRef = useRef<HTMLElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const [measured, setMeasured] = useState<MeasuredRail>(UNMEASURED);
    const allLabel = t('media.tags_all');
    const untaggedLabel = t('media.tags_untagged');
    const measureKey = `${allLabel}\n${untaggedLabel}\n${tags.map((tag) => `${tag.id}:${tag.name}`).join('\n')}`;
    const allSelected = selectedTagId === null && !untagged;
    const selectedTag = tags.find((tag) => tag.id === selectedTagId) ?? null;
    const ready =
        measured.available > 0 &&
        measured.menuWidth > 0 &&
        measured.fixedWidths.length === 2 &&
        measured.fixedWidths.every((width) => width > 0) &&
        tags.every((tag) => (measured.widthById.get(tag.id) ?? 0) > 0);
    const fit = useMemo(() => {
        if (!ready) {
            return {
                tags: visibleMediaTags(tags, selectedTagId),
                truncateId: null,
                truncatePx: null,
                fixedOverflow: false,
            };
        }

        return fitMediaTagRail(tags, selectedTagId, measured.widthById, {
            available: measured.available,
            fixedWidths: measured.fixedWidths,
            menuWidth: measured.menuWidth,
            gap: measured.gap,
        });
    }, [measured, ready, selectedTagId, tags]);
    const visibleTags = fit.tags;
    const overflowTags = useMemo(() => {
        const visibleIds = new Set(visibleTags.map((tag) => tag.id));

        return tags.filter((tag) => !visibleIds.has(tag.id));
    }, [tags, visibleTags]);
    const showManage = canManage && selectedTag !== null && onRename !== undefined && onDelete !== undefined;

    useLayoutEffect(() => {
        const nav = navRef.current;
        const measure = measureRef.current;

        if (nav === null || measure === null) {
            return;
        }

        const read = () => {
            const gapValue = Number.parseFloat(getComputedStyle(nav).columnGap);
            const widthById = new Map<string, number>();

            for (const node of measure.querySelectorAll<HTMLElement>('[data-tag-id]')) {
                const id = node.dataset.tagId;

                if (id) {
                    widthById.set(id, elementWidth(node));
                }
            }

            const next: MeasuredRail = {
                available: Math.floor(nav.clientWidth),
                gap: Number.isFinite(gapValue) ? gapValue : MEDIA_TAG_RAIL_GAP_PX,
                fixedWidths: ['all', 'untagged'].map((key) =>
                    elementWidth(measure.querySelector<HTMLElement>(`[data-measure="${key}"]`))
                ),
                menuWidth: elementWidth(measure.querySelector<HTMLElement>('[data-measure="menu"]')),
                widthById,
            };

            setMeasured((current) => (measuredEqual(current, next) ? current : next));
        };

        read();

        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);

        observer?.observe(nav);

        let cancelled = false;
        const fonts = document.fonts;

        if (fonts?.ready !== undefined) {
            void fonts.ready.then(() => {
                if (!cancelled) {
                    read();
                }
            });
        }

        return () => {
            cancelled = true;
            observer?.disconnect();
        };
    }, [measureKey]);

    return (
        <div className="relative min-w-0 overflow-x-clip">
            <div className="pointer-events-none absolute h-0 w-full overflow-hidden" aria-hidden="true">
                <div ref={measureRef} className="flex w-max items-center gap-2">
                    <button type="button" tabIndex={-1} data-measure="all" className={tagPillClass(false, false)}>
                        {allLabel}
                    </button>
                    <button type="button" tabIndex={-1} data-measure="untagged" className={tagPillClass(false, false)}>
                        {untaggedLabel}
                    </button>
                    {tags.map((tag) => (
                        <button
                            key={tag.id}
                            type="button"
                            tabIndex={-1}
                            data-tag-id={tag.id}
                            className={tagPillClass(false, false)}
                        >
                            {tag.name}
                        </button>
                    ))}
                    <button type="button" tabIndex={-1} data-measure="menu" className={tagPillClass(false, false)}>
                        <IconDots className="size-4" aria-hidden="true" />
                    </button>
                </div>
            </div>
            <nav
                ref={navRef}
                className="flex w-full min-w-0 items-center gap-2 overflow-x-clip py-0.5"
                aria-label={t('media.tags')}
                data-media-tag-rail="true"
                data-media-tag-filter="true"
            >
                <button
                    type="button"
                    aria-pressed={allSelected}
                    aria-current={allSelected ? 'true' : undefined}
                    className={tagPillClass(allSelected, fit.fixedOverflow)}
                    onClick={onSelectAll}
                >
                    <span className={fit.fixedOverflow ? 'block min-w-0 truncate' : undefined}>{allLabel}</span>
                </button>
                <button
                    type="button"
                    aria-pressed={untagged}
                    aria-current={untagged ? 'true' : undefined}
                    title={`${untaggedLabel} (${untaggedCount})`}
                    className={tagPillClass(untagged, fit.fixedOverflow)}
                    onClick={onSelectUntagged}
                >
                    <span className={fit.fixedOverflow ? 'block min-w-0 truncate' : undefined}>{untaggedLabel}</span>
                </button>
                {visibleTags.map((tag) => {
                    const truncated = fit.truncateId === tag.id;

                    return (
                        <button
                            key={tag.id}
                            type="button"
                            aria-pressed={selectedTagId === tag.id}
                            aria-current={selectedTagId === tag.id ? 'true' : undefined}
                            title={`${tag.name} (${tag.media_count ?? 0})`}
                            className={tagPillClass(selectedTagId === tag.id, truncated)}
                            style={truncated && fit.truncatePx !== null ? { maxWidth: fit.truncatePx } : undefined}
                            onClick={() => onSelectTag(tag)}
                        >
                            <span className={truncated ? 'block min-w-0 truncate' : undefined}>{tag.name}</span>
                        </button>
                    );
                })}
                <Dropdown>
                    <DropdownButton
                        as="button"
                        type="button"
                        className={tagPillClass(false, false)}
                        aria-label={t('media.tags_filter')}
                    >
                        <IconDots className="size-4" aria-hidden="true" />
                    </DropdownButton>
                    <DropdownMenu anchor="bottom start">
                        {overflowTags.map((tag) => (
                            <DropdownItem key={tag.id} onClick={() => onSelectTag(tag)}>
                                <DropdownLabel>
                                    {tag.name}
                                    <span className="ml-2 text-zinc-400 tabular-nums">{tag.media_count ?? 0}</span>
                                </DropdownLabel>
                            </DropdownItem>
                        ))}
                        {overflowTags.length > 0 && (onCreate || showManage) ? <DropdownDivider /> : null}
                        {onCreate ? (
                            <DropdownItem onClick={onCreate}>
                                <IconPlus data-slot="icon" />
                                <DropdownLabel>{t('media.tags_new')}</DropdownLabel>
                            </DropdownItem>
                        ) : null}
                        {showManage && selectedTag !== null ? (
                            <>
                                {onCreate ? <DropdownDivider /> : null}
                                <DropdownItem onClick={() => onRename(selectedTag)}>
                                    <DropdownLabel>{t('media.tags_rename')}</DropdownLabel>
                                </DropdownItem>
                                <DropdownItem onClick={() => onDelete(selectedTag)}>
                                    <DropdownLabel>{t('media.tags_delete')}</DropdownLabel>
                                </DropdownItem>
                            </>
                        ) : null}
                    </DropdownMenu>
                </Dropdown>
                <span className="sr-only">
                    {allLabel} {allCount}
                </span>
            </nav>
        </div>
    );
}
