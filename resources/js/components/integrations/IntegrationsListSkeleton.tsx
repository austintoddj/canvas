import { Skeleton } from '@/components/Skeleton';

export function IntegrationsListSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            aria-hidden="true"
            data-integrations-list-skeleton="true"
            data-integrations-cards-skeleton="true"
        >
            {Array.from({ length: rows }, (_, index) => (
                <div
                    key={index}
                    className="flex h-full flex-col rounded-xl border border-zinc-950/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.02] dark:shadow-none dark:ring-1 dark:ring-white/5"
                >
                    <div className="flex items-start justify-between gap-2">
                        <Skeleton className="size-11 shrink-0 rounded-xl" />
                        <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                    <div className="mt-3 min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <Skeleton className="h-3 w-full rounded-md" />
                        <Skeleton className="h-3 w-3/4 max-w-full rounded-md" />
                    </div>
                    <div className="mt-4">
                        <Skeleton className="h-8 w-24 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}
