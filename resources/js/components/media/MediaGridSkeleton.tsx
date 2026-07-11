import clsx from 'clsx';

import { Skeleton } from '@/components/Skeleton';
import { MEDIA_GRID_CLASS_NAME, MEDIA_GRID_SKELETON_COUNT } from '@/lib/media/layout';

type MediaGridSkeletonProps = {
    className?: string;
    count?: number;
};

export function MediaGridSkeleton({ className, count = MEDIA_GRID_SKELETON_COUNT }: MediaGridSkeletonProps) {
    return (
        <div
            className={clsx(className, MEDIA_GRID_CLASS_NAME)}
            aria-busy="true"
            aria-live="polite"
            data-media-grid-skeleton="true"
        >
            <span className="sr-only">Loading media…</span>
            {Array.from({ length: count }, (_, index) => (
                <Skeleton key={index} className="aspect-square" />
            ))}
        </div>
    );
}
