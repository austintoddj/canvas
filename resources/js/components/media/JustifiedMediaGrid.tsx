import clsx from 'clsx';
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
    JUSTIFIED_GAP_PX,
    JUSTIFIED_TARGET_ROW_HEIGHT_PAGE,
    layoutJustifiedRows,
    type JustifiedItem,
    type JustifiedTile,
} from '@/lib/media/justified';

type JustifiedMediaGridProps = {
    items: readonly JustifiedItem[];
    className?: string;
    targetRowHeight?: number;
    gap?: number;
    'data-media-grid'?: string;
    'aria-busy'?: boolean | 'true' | 'false';
    renderTile: (tile: JustifiedTile, item: JustifiedItem) => ReactNode;
};

export function JustifiedMediaGrid({
    items,
    className,
    targetRowHeight = JUSTIFIED_TARGET_ROW_HEIGHT_PAGE,
    gap = JUSTIFIED_GAP_PX,
    renderTile,
    'data-media-grid': dataMediaGrid,
    'aria-busy': ariaBusy,
}: JustifiedMediaGridProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useLayoutEffect(() => {
        const node = containerRef.current;

        if (node === null) {
            return;
        }

        const update = () => {
            setContainerWidth(Math.floor(node.getBoundingClientRect().width));
        };

        update();

        const observer = new ResizeObserver(() => {
            update();
        });

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, []);

    const rows = useMemo(
        () => layoutJustifiedRows(items, containerWidth, { targetRowHeight, gap }),
        [items, containerWidth, targetRowHeight, gap]
    );

    const itemsById = useMemo(() => {
        const map = new Map<string, JustifiedItem>();

        for (const item of items) {
            map.set(item.id, item);
        }

        return map;
    }, [items]);

    return (
        <div
            ref={containerRef}
            className={clsx('w-full', className)}
            data-media-grid={dataMediaGrid}
            data-justified-media-grid="true"
            aria-busy={ariaBusy}
        >
            {containerWidth > 0
                ? rows.map((row, rowIndex) => (
                      <div
                          key={`row-${rowIndex}-${row.tiles.map((tile) => tile.id).join('-')}`}
                          className="flex"
                          style={{
                              gap,
                              marginBottom: rowIndex < rows.length - 1 ? gap : 0,
                              height: row.height,
                          }}
                      >
                          {row.tiles.map((tile) => {
                              const item = itemsById.get(tile.id);

                              if (item === undefined) {
                                  return null;
                              }

                              return (
                                  <div
                                      key={tile.id}
                                      className="relative shrink-0 overflow-hidden rounded-xl"
                                      style={{ width: tile.width, height: tile.height }}
                                  >
                                      {renderTile(tile, item)}
                                  </div>
                              );
                          })}
                      </div>
                  ))
                : null}
        </div>
    );
}
