import clsx from 'clsx';

type SkeletonProps = {
    className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={clsx('animate-pulse rounded-xl bg-zinc-950/5 dark:bg-white/5', className)} aria-hidden="true" />
    );
}
