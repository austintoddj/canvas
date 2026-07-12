import clsx from 'clsx';
import { Children, type MouseEvent, type ReactNode } from 'react';
import { Link } from '@/components/link';

const finePointerHover = '[@media(hover:hover)_and_(pointer:fine)]:';

type ListRowEndProps = {
    date: string;
    children?: ReactNode;
    className?: string;
};

/**
 * Trailing list-row rail: Gmail-style date with actions.
 * Fine pointer + hover: date/actions cross-fade on row hover/focus-within.
 * Touch / coarse / reduced-motion: date and actions both stay visible.
 * When there are no actions, only the date is shown (no hover swap).
 */
export function ListRowEnd({ date, children, className }: ListRowEndProps) {
    const hasActions = Children.toArray(children).length > 0;

    return (
        <div
            data-list-row-end
            className={clsx(
                'relative z-10 flex shrink-0 items-center justify-end gap-2',
                hasActions && `${finePointerHover}min-h-10 ${finePointerHover}min-w-[5.5rem]`,
                className
            )}
        >
            <span
                data-list-row-date
                className={clsx(
                    'text-sm tabular-nums text-canvas-muted dark:text-canvas-muted-dark',
                    hasActions &&
                        clsx(
                            `${finePointerHover}pointer-events-none ${finePointerHover}absolute ${finePointerHover}inset-y-0 ${finePointerHover}right-0 ${finePointerHover}flex ${finePointerHover}items-center`,
                            `${finePointerHover}transition-opacity ${finePointerHover}duration-150`,
                            `${finePointerHover}group-hover/list-row:opacity-0 ${finePointerHover}group-focus-within/list-row:opacity-0`,
                            'motion-reduce:static motion-reduce:opacity-100'
                        )
                )}
            >
                {date}
            </span>
            {hasActions ? (
                <div
                    data-list-row-actions
                    className={clsx(
                        'flex items-center gap-0.5',
                        `${finePointerHover}absolute ${finePointerHover}inset-y-0 ${finePointerHover}right-0 ${finePointerHover}flex ${finePointerHover}items-center`,
                        `${finePointerHover}opacity-0 ${finePointerHover}transition-opacity ${finePointerHover}duration-150`,
                        `${finePointerHover}group-hover/list-row:opacity-100 ${finePointerHover}group-focus-within/list-row:opacity-100`,
                        'motion-reduce:static motion-reduce:opacity-100'
                    )}
                >
                    {children}
                </div>
            ) : null}
        </div>
    );
}

const actionClassName = (danger?: boolean) =>
    clsx(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-lg',
        'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        danger
            ? 'text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/10'
            : 'text-zinc-500 hover:bg-zinc-950/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-200'
    );

type ListRowActionButtonProps = {
    label: string;
    danger?: boolean;
    disabled?: boolean;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    children: React.ReactNode;
};

export function ListRowActionButton({ label, danger, disabled, onClick, children }: ListRowActionButtonProps) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            className={actionClassName(danger)}
            onClick={(event) => {
                event.stopPropagation();
                onClick?.(event);
            }}
            onKeyDown={(event) => event.stopPropagation()}
        >
            {children}
        </button>
    );
}

type ListRowActionLinkProps = {
    label: string;
    href: string;
    children: React.ReactNode;
};

export function ListRowActionLink({ label, href, children }: ListRowActionLinkProps) {
    return (
        <Link
            href={href}
            aria-label={label}
            title={label}
            className={actionClassName(false)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
        >
            {children}
        </Link>
    );
}
