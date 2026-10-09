import * as Headless from '@headlessui/react';

import { Button } from '@/components/button';
import { MediaTagPicker } from '@/components/media/MediaTagPicker';
import { useCanvas } from '@/hooks/useCanvas';
import type { MediaTag } from '@/types/api';

type MediaBulkTagMenuProps = {
    tags: MediaTag[];
    disabled?: boolean;
    onPick: (tag: MediaTag) => void;
    onCreate: (name: string) => Promise<void>;
};

export function MediaBulkTagMenu({ tags, disabled = false, onPick, onCreate }: MediaBulkTagMenuProps) {
    const { t } = useCanvas();

    return (
        <Headless.Popover className="w-full sm:w-auto">
            <Headless.PopoverButton as={Button} outline disabled={disabled} className="w-full sm:w-auto">
                {t('media.tags_add')}
            </Headless.PopoverButton>
            <Headless.PopoverPanel
                anchor="top end"
                focus
                portal
                transition
                className="z-50 w-72 max-w-[calc(100vw-1rem)] origin-bottom rounded-xl bg-white/75 p-1.5 shadow-lg ring-1 ring-zinc-950/10 outline-transparent backdrop-blur-xl [--anchor-gap:--spacing(2)] [--anchor-padding:--spacing(1)] transition focus:outline-hidden data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 dark:bg-zinc-800/75 dark:ring-white/10"
            >
                {({ close }) => (
                    <MediaTagPicker
                        variant="menu"
                        tags={tags}
                        disabled={disabled}
                        onPick={(tag) => {
                            close();
                            onPick(tag);
                        }}
                        onCreate={async (name) => {
                            await onCreate(name);
                            close();
                        }}
                    />
                )}
            </Headless.PopoverPanel>
        </Headless.Popover>
    );
}
