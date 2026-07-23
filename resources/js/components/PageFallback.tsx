import { Skeleton } from '@/components/Skeleton';

/**
 * Neutral Suspense fallback for lazy routes — not media-grid shaped.
 * Layout already supplies max-width and padding; keep this minimal.
 */
export function PageFallback() {
    return (
        <div className="space-y-8" aria-busy="true" data-page-fallback="true">
            <div className="space-y-2">
                <Skeleton className="h-8 w-40 rounded-lg" />
                <Skeleton className="h-4 w-64 max-w-full rounded-md" />
            </div>
            <div className="space-y-3">
                {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="h-12 w-full rounded-xl" />
                ))}
            </div>
        </div>
    );
}
