import { PhotoIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

import { Link } from '@/components/link';
import { Text } from '@/components/text';
import { mediaDisplayName } from '@/lib/media/list';
import type { Media } from '@/types/api';

type MediaGridProps = {
    items: Media[];
    emptyMessage?: string;
    className?: string;
    hrefForItem?: (item: Media) => string;
    onSelect?: (item: Media) => void;
};

export function MediaGrid({
    items,
    emptyMessage = 'No images found.',
    className,
    hrefForItem,
    onSelect,
}: MediaGridProps) {
    if (items.length === 0) {
        return (
            <div
                className={clsx(
                    className,
                    'flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-950/10 px-6 py-12 text-center dark:border-white/10'
                )}
            >
                <PhotoIcon className="size-10 text-zinc-400" />
                <Text className="mt-3 text-sm text-zinc-500">{emptyMessage}</Text>
            </div>
        );
    }

    return (
        <div className={clsx(className, 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4')}>
            {items.map((item) => {
                const label = mediaDisplayName(item);
                const content = (
                    <>
                        <img
                            src={item.url}
                            alt={item.alt ?? label}
                            className="aspect-square w-full object-cover transition group-hover:opacity-90"
                        />
                        <span className="block truncate px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {label}
                        </span>
                    </>
                );

                const itemClassName =
                    'group overflow-hidden rounded-lg border border-zinc-950/10 text-left transition hover:border-zinc-950/20 dark:border-white/10 dark:hover:border-white/20';

                if (hrefForItem) {
                    return (
                        <Link key={item.id} href={hrefForItem(item)} className={itemClassName}>
                            {content}
                        </Link>
                    );
                }

                return (
                    <button key={item.id} type="button" className={itemClassName} onClick={() => onSelect?.(item)}>
                        {content}
                    </button>
                );
            })}
        </div>
    );
}
