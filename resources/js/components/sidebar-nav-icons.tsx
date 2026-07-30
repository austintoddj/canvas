import clsx from 'clsx';
import { useId, type CSSProperties, type SVGProps } from 'react';

/**
 * Sidebar nav icons — hover contract:
 * 1. Shell scales up slightly and stays while hovered (non-scaling-stroke)
 * 2. A one-shot morph keyframe plays and returns to rest
 * 3. Morphs avoid path scale (constant optical stroke weight)
 *
 * Morph keyframes live in `resources/css/app.css` (`.sidebar-icon-morph-*`).
 */

type IconProps = SVGProps<SVGSVGElement>;

// Fixed size-5 to match Tabler rail icons (expand/collapse) — avoid 1.2em optical drift.
const shell =
    'sidebar-nav-icon size-5 shrink-0 origin-center overflow-visible transition-transform duration-200 ease-out motion-reduce:transition-none ' +
    'group-hover/sidebar-item:scale-[1.06] motion-reduce:group-hover/sidebar-item:scale-100';

function Svg({ className, children, ...props }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.85}
            strokeLinecap="round"
            strokeLinejoin="round"
            data-slot="icon"
            aria-hidden
            className={clsx(shell, className)}
            {...props}
        >
            {children}
        </svg>
    );
}

/** Search: glass nudge + handle flick, then rest. */
export function NavIconSearch(props: IconProps) {
    return (
        <Svg {...props}>
            <g className="sidebar-icon-morph-search-glass">
                <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
            </g>
            <path d="M21 21l-6 -6" className="sidebar-icon-morph-search-handle" />
        </Svg>
    );
}

/**
 * Dashboard: whole icon rotates once; tall tiles ease down, short tiles ease up
 * (reads as big/small swap without scaling strokes).
 */
export function NavIconDashboard(props: IconProps) {
    return (
        <Svg {...props}>
            <g className="sidebar-icon-morph-rotate origin-center">
                {/* Tall — top left */}
                <path
                    d="M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1"
                    className="sidebar-icon-morph-tile-tall"
                />
                {/* Short — bottom left */}
                <path
                    d="M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1"
                    className="sidebar-icon-morph-tile-short"
                />
                {/* Tall — bottom right */}
                <path
                    d="M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1"
                    className="sidebar-icon-morph-tile-tall"
                />
                {/* Short — top right */}
                <path
                    d="M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1"
                    className="sidebar-icon-morph-tile-short"
                />
            </g>
        </Svg>
    );
}

/** Posts: static page outline; text lines write L→R (staggered), then rest fully drawn. */
export function NavIconPosts(props: IconProps) {
    const clipId = `sidebar-posts-clip-${useId().replace(/:/g, '')}`;
    const line = (len: number, delayMs = 0): CSSProperties =>
        ({
            strokeDasharray: len,
            strokeDashoffset: 0,
            '--draw-len': len,
            ...(delayMs ? { animationDelay: `${delayMs}ms` } : null),
        }) as CSSProperties;

    return (
        <Svg {...props}>
            <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" />
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <g clipPath={`url(#${clipId})`}>
                <path d="M9 9h1" className="sidebar-icon-morph-posts-line" style={line(2)} />
                <path d="M9 13h6" className="sidebar-icon-morph-posts-line" style={line(6, 120)} />
                <path d="M9 17h6" className="sidebar-icon-morph-posts-line" style={line(6, 240)} />
            </g>
            <defs>
                <clipPath id={clipId}>
                    <rect x="7" y="7" width="10" height="12" rx="0.5" />
                </clipPath>
            </defs>
        </Svg>
    );
}

/**
 * Media: static sun; left ridge draws L→R; right ridge starts at the geometric
 * join (~84% of the left path) so both finish with a short overlap.
 * Path lengths are real getTotalLength-ish values (not padded) so time = pen travel.
 */
export function NavIconMedia(props: IconProps) {
    const mountain = (len: number): CSSProperties =>
        ({
            strokeDasharray: len,
            strokeDashoffset: 0,
            '--draw-len': len,
        }) as CSSProperties;

    return (
        <Svg {...props}>
            <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" />
            {/* Left ridge ≈ 17.5 units */}
            <path
                d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5"
                className="sidebar-icon-morph-mountain"
                style={mountain(17.6)}
            />
            {/* Right ridge ≈ 9 units; CSS delay 1.55s ≈ join on left descending slope */}
            <path
                d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3"
                className="sidebar-icon-morph-mountain-trail"
                style={mountain(9.1)}
            />
            <path d="M15 8h.01" />
        </Svg>
    );
}

/** Organize: layers peel apart then settle. */
export function NavIconOrganize(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M12 4l-8 4l8 4l8 -4l-8 -4" className="sidebar-icon-morph-stack-top" />
            <path d="M4 12l8 4l8 -4" />
            <path d="M4 16l8 4l8 -4" className="sidebar-icon-morph-stack-bottom" />
        </Svg>
    );
}

/** Users: figures separate then rejoin. */
export function NavIconUsers(props: IconProps) {
    return (
        <Svg {...props}>
            <g className="sidebar-icon-morph-users-left">
                <path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
            </g>
            <g className="sidebar-icon-morph-users-right">
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
            </g>
        </Svg>
    );
}

/** Integrations: awning hinges open then closes. */
export function NavIconIntegrations(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M3 21h18" />
            <path
                d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4"
                className="sidebar-icon-morph-awning"
            />
            <path d="M5 21V10.85" />
            <path d="M19 21V10.85" />
            <path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4" />
        </Svg>
    );
}
