import { Skeleton } from '@/components/Skeleton';

type TableListSkeletonProps = {
    rows?: number;
    columns?: number;
};

export function TableListSkeleton({ rows = 6, columns = 4 }: TableListSkeletonProps) {
    return (
        <div className="mt-8 space-y-3" aria-hidden="true" data-table-list-skeleton="true">
            <div className="flex gap-4 border-b border-zinc-950/5 pb-3 dark:border-white/5">
                {Array.from({ length: columns }, (_, index) => (
                    <Skeleton key={`head-${index}`} className="h-4 flex-1 rounded-md" />
                ))}
            </div>
            {Array.from({ length: rows }, (_, row) => (
                <div key={`row-${row}`} className="flex items-center gap-4 py-2">
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
