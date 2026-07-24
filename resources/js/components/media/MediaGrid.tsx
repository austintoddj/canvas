import clsx from 'clsx';
import { useMemo, type ReactNode } from 'react';

import { FadeInImage } from '@/components/FadeInImage';
import { JustifiedMediaGrid } from '@/components/media/JustifiedMediaGrid';
import { Link } from '@/components/link';
import { Text } from '@/components/text';
import { JUSTIFIED_TARGET_ROW_HEIGHT_DIALOG, JUSTIFIED_TARGET_ROW_HEIGHT_PAGE } from '@/lib/media/layout';
import { mediaDisplayName } from '@/lib/media/list';
import type { Media } from '@/types/api';
import { IconCheck, IconPhoto } from '@tabler/icons-react';

type MediaGridProps = {
    items: Media[];
    emptyMessage?: string;
    className?: string;
    showCaptions?: boolean;
    compact?: boolean;
    hrefForItem?: (item: Media) => string;
    onOpen?: (item: Media) => void;
    onSelect?: (item: Media) => void;
    selectedIds?: ReadonlySet<string>;
    onToggleSelect?: (item: Media) => void;
    selectionDisabled?: boolean;
};

function MediaSelectCheck({
    selected,
    disabled,
    label,
    onToggle,
    forceVisible,
}: {
    selected: boolean;
    disabled: boolean;
    label: string;
    onToggle: () => void;
    forceVisible: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            aria-label={selected ? `Deselect ${label}` : `Select ${label}`}
            aria-pressed={selected}
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggle();
            }}
            className={clsx(
                'absolute top-2 left-2 z-10 flex size-7 items-center justify-center rounded-full transition-[background-color,color,box-shadow,transform,opacity] duration-200 ease-out',
                'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                'disabled:cursor-not-allowed disabled:opacity-50',
                selected
                    ? 'scale-100 bg-blue-600 text-white opacity-100 shadow-md shadow-blue-950/25 ring-2 ring-white dark:bg-blue-500 dark:ring-zinc-950'
                    : clsx(
                          'bg-white/90 text-zinc-700 shadow-sm ring-1 ring-black/10 backdrop-blur-sm dark:bg-zinc-900/85 dark:text-zinc-100 dark:ring-white/20',
                          'hover:bg-white hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-white',
                          forceVisible
                              ? 'opacity-100'
                              : 'opacity-0 group-hover/tile:opacity-100 focus-visible:opacity-100 max-sm:opacity-100'
                      )
            )}
        >
            <IconCheck
                className={clsx('size-4', selected ? 'opacity-100' : 'opacity-70 group-hover/tile:opacity-100')}
                aria-hidden="true"
            />
        </button>
    );
}

export function MediaGrid({
    items,
    emptyMessage = 'No images found.',
    className,
    showCaptions = false,
    compact = false,
    hrefForItem,
    onOpen,
    onSelect,
    selectedIds,
    onToggleSelect,
    selectionDisabled = false,
}: MediaGridProps) {
    const justifiedItems = useMemo(
        () =>
            items.map((item) => ({
                id: item.id,
                width: item.width,
                height: item.height,
            })),
        [items]
    );

    const itemsById = useMemo(() => {
        const map = new Map<string, Media>();

        for (const item of items) {
            map.set(item.id, item);
        }

        return map;
    }, [items]);

    if (items.length === 0) {
        return (
            <div
                className={clsx(
                    className,
                    'flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-950/10 bg-zinc-950/[0.01] px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.02]'
                )}
                data-media-filtered-empty="true"
            >
                <span className="flex size-11 items-center justify-center rounded-full bg-zinc-950/5 text-zinc-400 dark:bg-white/10 dark:text-zinc-400">
                    <IconPhoto className="size-5" />
                </span>
                <Text className="mt-3 text-sm text-canvas-muted dark:text-canvas-muted-dark">{emptyMessage}</Text>
            </div>
        );
    }

    const selectable = typeof onToggleSelect === 'function';
    const selectionActive = selectable && (selectedIds?.size ?? 0) > 0;

    return (
        <JustifiedMediaGrid
            className={className}
            items={justifiedItems}
            targetRowHeight={compact ? JUSTIFIED_TARGET_ROW_HEIGHT_DIALOG : JUSTIFIED_TARGET_ROW_HEIGHT_PAGE}
            data-media-grid="true"
            renderTile={(tile) => {
                const item = itemsById.get(tile.id);

                if (item === undefined) {
                    return null;
                }

                const label = mediaDisplayName(item);
                const isSelected = selectedIds?.has(item.id) ?? false;

                const shellClassName = clsx(
                    'group/tile relative size-full overflow-hidden rounded-xl border bg-white text-left shadow-sm shadow-zinc-950/5 transition duration-200 dark:bg-zinc-800/60 dark:shadow-none',
                    isSelected
                        ? 'border-blue-600 ring-2 ring-inset ring-blue-600/30 dark:border-blue-400 dark:ring-blue-400/35'
                        : 'border-zinc-950/10 hover:border-zinc-950/20 hover:shadow-md hover:shadow-zinc-950/10 dark:border-white/10 dark:ring-1 dark:ring-white/5 dark:hover:border-white/20 dark:hover:bg-zinc-800/80 dark:hover:ring-white/10'
                );

                // Equal inset (not scale): scale() insets proportionally to each axis, so
                // wide tiles get thicker side gaps than top/bottom. Absolute inset keeps
                // the blue frame even. Radius stays on the photo frame at all times so
                // corners never square-pop while animating in/out of selection.
                const mediaSurface = (
                    <div
                        className={clsx(
                            'relative size-full overflow-hidden bg-zinc-950/[0.03] transition-colors duration-200 dark:bg-white/[0.03]',
                            isSelected && 'bg-blue-600/10 dark:bg-blue-400/15'
                        )}
                    >
                        <div
                            className={clsx(
                                'absolute overflow-hidden rounded-[0.65rem]',
                                'transition-[top,right,bottom,left,transform] duration-300 ease-in-out motion-reduce:transition-none',
                                isSelected
                                    ? 'inset-1.5'
                                    : 'inset-0 group-hover/tile:scale-[1.02] motion-reduce:group-hover/tile:scale-100'
                            )}
                        >
                            <FadeInImage src={item.url} alt={item.alt ?? label} className="size-full object-cover" />
                        </div>
                    </div>
                );

                const caption = showCaptions ? (
                    <span
                        className="block truncate px-2.5 py-2 text-xs text-canvas-muted dark:text-canvas-muted-dark"
                        data-media-tile-caption="true"
                    >
                        {label}
                    </span>
                ) : null;

                const openClassName =
                    'block size-full text-left focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';

                let body: ReactNode;

                if (hrefForItem) {
                    body = (
                        <Link href={hrefForItem(item)} className={openClassName} aria-label={label}>
                            {mediaSurface}
                            {caption}
                        </Link>
                    );
                } else if (onOpen) {
                    body = (
                        <button
                            data-media-tile="true"
                            data-media-id={item.id}
                            type="button"
                            className={openClassName}
                            aria-label={label}
                            onClick={() => {
                                if (selectionActive) {
                                    onToggleSelect?.(item);
                                    return;
                                }

                                onOpen(item);
                            }}
                        >
                            {mediaSurface}
                            {caption}
                        </button>
                    );
                } else {
                    body = (
                        <button
                            type="button"
                            className={openClassName}
                            aria-label={label}
                            data-media-tile="true"
                            data-media-id={item.id}
                            onClick={() => onSelect?.(item)}
                        >
                            {mediaSurface}
                            {caption}
                        </button>
                    );
                }

                return (
                    <div className={shellClassName} data-selected={isSelected ? 'true' : undefined}>
                        {body}
                        {selectable ? (
                            <MediaSelectCheck
                                selected={isSelected}
                                disabled={selectionDisabled}
                                label={label}
                                forceVisible={selectionActive || isSelected}
                                onToggle={() => onToggleSelect(item)}
                            />
                        ) : null}
                    </div>
                );
            }}
        />
    );
}
