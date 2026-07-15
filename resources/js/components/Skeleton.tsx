import clsx from 'clsx';
import type { CSSProperties } from 'react';

type SkeletonProps = {
    className?: string;
    style?: CSSProperties;
};

export function Skeleton({ className, style }: SkeletonProps) {
    return (
        <div
            className={clsx('animate-pulse rounded-xl bg-zinc-950/5 dark:bg-white/5', className)}
            style={style}
            aria-hidden="true"
        />
    );
}
