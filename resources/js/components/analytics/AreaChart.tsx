import { useId, useMemo, useState, type MouseEvent } from 'react';

import { Text } from '@/components/text';
import { seriesGeometry, type DailyDataPoint } from '@/lib/analytics';

type AreaChartProps = {
    data: DailyDataPoint[];
    title?: string;
    caption?: string;
    emptyLabel?: string;
    className?: string;
};

const VIEW_W = 800;
const VIEW_H = 220;
const PAD = { top: 12, right: 8, bottom: 8, left: 8 };

export default function AreaChart({
    data,
    title,
    caption,
    emptyLabel = 'No data for this period.',
    className,
}: AreaChartProps) {
    const reactId = useId();
    const gradientId = `area-fill-${reactId.replace(/:/g, '')}`;
    const total = data.reduce((sum, point) => sum + point.value, 0);
    const geometry = useMemo(() => seriesGeometry(data, VIEW_W, VIEW_H, PAD), [data]);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    const hoverPoint = hoverIndex !== null ? geometry.points[hoverIndex] : null;

    function handleMove(event: MouseEvent<SVGSVGElement>) {
        if (geometry.points.length === 0) {
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * VIEW_W;
        let nearest = 0;
        let best = Number.POSITIVE_INFINITY;

        for (let i = 0; i < geometry.points.length; i++) {
            const distance = Math.abs(geometry.points[i]!.x - x);

            if (distance < best) {
                best = distance;
                nearest = i;
            }
        }

        setHoverIndex(nearest);
    }

    return (
        <div
            className={
                className ??
                'rounded-xl border border-zinc-950/10 p-5 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5'
            }
        >
            {(title || caption) && (
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    {title ? (
                        <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">{title}</Text>
                    ) : (
                        <span />
                    )}
                    {caption ? (
                        <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">{caption}</Text>
                    ) : null}
                </div>
            )}

            {data.length === 0 ? (
                <Text className="mt-8 text-sm text-canvas-muted dark:text-canvas-muted-dark">{emptyLabel}</Text>
            ) : (
                <div className="relative mt-4">
                    {hoverPoint ? (
                        <div
                            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-zinc-950/10 bg-white px-2.5 py-1.5 text-xs shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:shadow-none"
                            style={{
                                left: `${(hoverPoint.x / VIEW_W) * 100}%`,
                                top: 0,
                            }}
                            role="tooltip"
                        >
                            <div className="font-medium text-zinc-950 dark:text-white">
                                {hoverPoint.value.toLocaleString()}
                            </div>
                            <div className="text-canvas-muted dark:text-canvas-muted-dark">{hoverPoint.label}</div>
                        </div>
                    ) : null}

                    <svg
                        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                        className="h-52 w-full sm:h-56"
                        role="img"
                        aria-label={
                            title
                                ? `${title}: ${total.toLocaleString()} over the last ${data.length} days`
                                : `${total.toLocaleString()} over the last ${data.length} days`
                        }
                        onMouseMove={handleMove}
                        onMouseLeave={() => setHoverIndex(null)}
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id={`${gradientId}-light`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
                                <stop offset="55%" stopColor="#60a5fa" stopOpacity="0.08" />
                                <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id={`${gradientId}-dark`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.32" />
                                <stop offset="55%" stopColor="#3b82f6" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {[0.25, 0.5, 0.75].map((fraction) => {
                            const y = PAD.top + (VIEW_H - PAD.top - PAD.bottom) * fraction;

                            return (
                                <line
                                    key={fraction}
                                    x1={PAD.left}
                                    y1={y}
                                    x2={VIEW_W - PAD.right}
                                    y2={y}
                                    className="stroke-zinc-950/5 dark:stroke-white/5"
                                    strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                />
                            );
                        })}

                        {geometry.areaPath ? (
                            <>
                                <path
                                    d={geometry.areaPath}
                                    fill={`url(#${gradientId}-light)`}
                                    className="dark:hidden"
                                />
                                <path
                                    d={geometry.areaPath}
                                    fill={`url(#${gradientId}-dark)`}
                                    className="hidden dark:block"
                                />
                            </>
                        ) : null}

                        <path
                            d={geometry.linePath}
                            fill="none"
                            className="stroke-blue-500 dark:stroke-blue-400"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />

                        {hoverPoint ? (
                            <>
                                <line
                                    x1={hoverPoint.x}
                                    y1={PAD.top}
                                    x2={hoverPoint.x}
                                    y2={VIEW_H - PAD.bottom}
                                    className="stroke-blue-500/30 dark:stroke-blue-400/30"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                    vectorEffect="non-scaling-stroke"
                                />
                                <circle
                                    cx={hoverPoint.x}
                                    cy={hoverPoint.y}
                                    r="4.5"
                                    className="fill-blue-500 stroke-white dark:fill-blue-400 dark:stroke-zinc-900"
                                    strokeWidth="2"
                                />
                            </>
                        ) : null}
                    </svg>

                    <div className="mt-2 flex justify-between text-xs text-canvas-muted dark:text-canvas-muted-dark">
                        <span>{data[0]?.label}</span>
                        <span>{data[data.length - 1]?.label}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
