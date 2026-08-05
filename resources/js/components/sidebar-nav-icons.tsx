import clsx from 'clsx';
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

// Fixed size-5 to match Tabler rail icons (expand/collapse) — avoid 1.2em optical drift.
const shell = 'size-5 shrink-0';

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

export function NavIconSearch(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
            <path d="M21 21l-6 -6" />
        </Svg>
    );
}

export function NavIconDashboard(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
            <path d="M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
            <path d="M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
            <path d="M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
        </Svg>
    );
}

export function NavIconPosts(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" />
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M9 9h1" />
            <path d="M9 13h6" />
            <path d="M9 17h6" />
        </Svg>
    );
}

export function NavIconMedia(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" />
            <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />
            <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
            <path d="M15 8h.01" />
        </Svg>
    );
}

export function NavIconCalendar(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" />
            <path d="M16 3v4" />
            <path d="M8 3v4" />
            <path d="M4 11h16" />
            <path d="M8 15h2v2h-2z" />
        </Svg>
    );
}

export function NavIconOrganize(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M12 4l-8 4l8 4l8 -4l-8 -4" />
            <path d="M4 12l8 4l8 -4" />
            <path d="M4 16l8 4l8 -4" />
        </Svg>
    );
}

export function NavIconUsers(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
            <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
        </Svg>
    );
}

export function NavIconIntegrations(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M3 21h18" />
            <path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4" />
            <path d="M5 21V10.85" />
            <path d="M19 21V10.85" />
            <path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4" />
        </Svg>
    );
}
