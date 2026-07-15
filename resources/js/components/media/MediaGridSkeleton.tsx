import clsx from 'clsx';

import { Skeleton } from '@/components/Skeleton';
import {
    JUSTIFIED_GAP_PX,
    JUSTIFIED_TARGET_ROW_HEIGHT_DIALOG,
    JUSTIFIED_TARGET_ROW_HEIGHT_PAGE,
    MEDIA_GRID_SKELETON_COUNT,
} from '@/lib/media/layout';

type MediaGridSkeletonProps = {
    className?: string;
    count?: number;
    compact?: boolean;
};

const SKELETON_ASPECTS = [1.6, 0.75, 1.2, 1, 1.4, 0.85, 1.5, 0.9];

export function MediaGridSkeleton({
    className,
    count = MEDIA_GRID_SKELETON_COUNT,
    compact = false,
}: MediaGridSkeletonProps) {
    const rowHeight = compact ? JUSTIFIED_TARGET_ROW_HEIGHT_DIALOG : JUSTIFIED_TARGET_ROW_HEIGHT_PAGE;
    const gap = JUSTIFIED_GAP_PX;

    return (
        <div
            className={clsx(className, 'flex w-full flex-wrap')}
            style={{ gap }}
            aria-busy="true"
            aria-live="polite"
            data-media-grid-skeleton="true"
        >
            <span className="sr-only">Loading media…</span>
            {Array.from({ length: count }, (_, index) => {
                const aspect = SKELETON_ASPECTS[index % SKELETON_ASPECTS.length];
                const width = rowHeight * aspect;

                return (
                    <Skeleton
                        key={index}
                        className="shrink-0 rounded-xl"
                        style={{ width: `${width}px`, height: `${rowHeight}px` }}
                    />
                );
            })}
        </div>
    );
}
