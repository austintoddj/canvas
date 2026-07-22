import { useId } from 'react';

import { seriesGeometry, type DailyDataPoint } from '@/lib/analytics';

type SparklineProps = {
    data: DailyDataPoint[];
    className?: string;
    'aria-hidden'?: boolean;
};

const VIEW_W = 120;
const VIEW_H = 28;

export default function Sparkline({ data, className, 'aria-hidden': ariaHidden = true }: SparklineProps) {
    const reactId = useId();
    const gradientId = `sparkline-fill-${reactId.replace(/:/g, '')}`;
    const { linePath, areaPath, points } = seriesGeometry(data, VIEW_W, VIEW_H, {
        top: 2,
        right: 1,
        bottom: 2,
        left: 1,
    });

    if (points.length === 0) {
        return (
            <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                className={className ?? 'h-7 w-full'}
                aria-hidden={ariaHidden}
                preserveAspectRatio="none"
            >
                <line
                    x1="0"
                    y1={VIEW_H / 2}
                    x2={VIEW_W}
                    y2={VIEW_H / 2}
                    className="stroke-zinc-950/10 dark:stroke-white/10"
                    strokeWidth="1"
                />
            </svg>
        );
    }

    return (
        <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className={className ?? 'h-7 w-full'}
            aria-hidden={ariaHidden}
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient id={`${gradientId}-light`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${gradientId}-dark`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
                </linearGradient>
            </defs>
            {areaPath ? (
                <>
                    <path d={areaPath} fill={`url(#${gradientId}-light)`} className="dark:hidden" />
                    <path d={areaPath} fill={`url(#${gradientId}-dark)`} className="hidden dark:block" />
                </>
            ) : null}
            <path
                d={linePath}
                fill="none"
                className="stroke-blue-500 dark:stroke-blue-400"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
