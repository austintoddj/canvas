import { Skeleton } from '@/components/Skeleton';

type TableListSkeletonProps = {
    rows?: number;
    columns?: number;
};

export function TableListSkeleton({ rows = 6, columns = 4 }: TableListSkeletonProps) {
    return (
        <div
            className="overflow-hidden rounded-xl border border-zinc-950/10 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5"
            aria-hidden="true"
            data-table-list-skeleton="true"
        >
            {Array.from({ length: rows }, (_, row) => (
                <div
                    key={`row-${row}`}
                    className="flex items-center gap-4 px-4 py-4 even:bg-zinc-950/2.5 dark:even:bg-white/2.5"
                >
                    {Array.from({ length: columns }, (_, col) => (
                        <Skeleton
                            key={`cell-${row}-${col}`}
                            className={col === 0 ? 'h-5 flex-[2] rounded-md' : 'h-5 flex-1 rounded-md'}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
