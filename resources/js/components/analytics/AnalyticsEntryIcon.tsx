import { useState } from 'react';

import { resolveAnalyticsMark, type AnalyticsFallbackKind, type AnalyticsIconKind } from '@/lib/analytics-icons';
import { IconBrowser, IconClock, IconGlobe, IconLink, IconWorld } from '@tabler/icons-react';

const FALLBACK_ICONS: Record<AnalyticsFallbackKind, typeof IconGlobe> = {
    globe: IconGlobe,
    link: IconLink,
    browser: IconBrowser,
    clock: IconClock,
    world: IconWorld,
};

function FallbackGlyph({ kind }: { kind: AnalyticsFallbackKind }) {
    const Icon = FALLBACK_ICONS[kind];

    return <Icon className="size-3.5 text-zinc-500 dark:text-zinc-400" data-slot="icon" />;
}

export default function AnalyticsEntryIcon({
    kind,
    label,
    className,
}: {
    kind: AnalyticsIconKind;
    label: string;
    className?: string;
}) {
    const mark = resolveAnalyticsMark(kind, label);
    const [failed, setFailed] = useState(false);

    const showLogo = mark.type === 'logo' && !failed;

    return (
        <span
            className={`inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-950/5 ring-1 ring-zinc-950/5 dark:bg-white/8 dark:ring-white/10 ${className ?? ''}`}
            aria-hidden="true"
        >
            {showLogo ? (
                <img
                    src={mark.src}
                    alt=""
                    width={18}
                    height={18}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="size-[18px] object-contain"
                    onError={() => setFailed(true)}
                />
            ) : (
                <FallbackGlyph kind={mark.type === 'fallback' ? mark.fallback : 'globe'} />
            )}
        </span>
    );
}
