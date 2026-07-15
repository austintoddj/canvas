import { Skeleton } from '@/components/Skeleton';

export function IntegrationsListSkeleton({ rows = 2 }: { rows?: number }) {
    return (
        <div
            className="divide-y divide-zinc-950/5 overflow-hidden rounded-xl border border-zinc-950/10 dark:divide-white/5 dark:border-white/10"
            aria-hidden="true"
            data-integrations-list-skeleton="true"
        >
            {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
                    <Skeleton className="size-11 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-24 rounded-md" />
                            <Skeleton className="h-5 w-20 rounded-md" />
                        </div>
                        <Skeleton className="h-3.5 w-48 max-w-full rounded-md" />
                    </div>
                    <Skeleton className="h-9 w-24 shrink-0 rounded-lg" />
                </div>
            ))}
        </div>
    );
}
