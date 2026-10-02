import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import { useMemo, useState } from 'react';

import { useCanvas } from '@/hooks/useCanvas';
import type { MediaTag } from '@/types/api';

type MediaTagPickerProps = {
    tags: MediaTag[];
    excludeIds?: ReadonlySet<string>;
    disabled?: boolean;
    onPick: (tag: MediaTag) => void;
    onCreate: (name: string) => Promise<void>;
};

export function MediaTagPicker({ tags, excludeIds, disabled = false, onPick, onCreate }: MediaTagPickerProps) {
    const { t } = useCanvas();
    const [query, setQuery] = useState('');
    const [creating, setCreating] = useState(false);

    const available = useMemo(() => tags.filter((tag) => !excludeIds?.has(tag.id)), [excludeIds, tags]);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();

        if (needle === '') {
            return available;
        }

        return available.filter((tag) => tag.name.toLowerCase().includes(needle));
    }, [available, query]);

    const exactMatch = available.some((tag) => tag.name.trim().toLowerCase() === query.trim().toLowerCase());
    const canCreate = query.trim() !== '' && !exactMatch;

    async function handleCreate() {
        const name = query.trim();

        if (name === '' || creating) {
            return;
        }

        setCreating(true);

        try {
            await onCreate(name);
            setQuery('');
        } finally {
            setCreating(false);
        }
    }

    return (
        <Headless.Combobox
            disabled={disabled || creating}
            onChange={(tag: MediaTag | null) => {
                if (tag !== null) {
                    onPick(tag);
                    setQuery('');
                }
            }}
        >
            <Headless.ComboboxInput
                disabled={disabled || creating}
                value={query}
                aria-label={t('media.tags_add')}
                placeholder={t('media.tags_add')}
                className="w-full rounded-lg border-none bg-white px-3 py-2 text-sm text-zinc-950 ring-1 ring-zinc-950/10 outline-hidden placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white dark:ring-white/10 dark:placeholder:text-zinc-500"
                onChange={(event) => setQuery(event.target.value)}
            />
            <Headless.ComboboxOptions
                static
                className="mt-1 max-h-56 overflow-y-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-800 dark:ring-white/10"
            >
                {filtered.map((tag) => (
                    <Headless.ComboboxOption
                        key={tag.id}
                        value={tag}
                        className={({ focus }) =>
                            clsx(
                                'cursor-pointer px-3 py-2 text-sm',
                                focus
                                    ? 'bg-zinc-950/5 text-zinc-950 dark:bg-white/10 dark:text-white'
                                    : 'text-zinc-700 dark:text-zinc-200'
                            )
                        }
                    >
                        {tag.name}
                    </Headless.ComboboxOption>
                ))}
                {canCreate ? (
                    <button
                        type="button"
                        disabled={creating}
                        className="block w-full px-3 py-2 text-left text-sm text-zinc-950 hover:bg-zinc-950/5 dark:text-white dark:hover:bg-white/10"
                        onClick={() => void handleCreate()}
                    >
                        {t('media.tags_create', { name: query.trim() })}
                    </button>
                ) : null}
                {filtered.length === 0 && !canCreate ? (
                    <div className="px-3 py-2 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                        {t('media.tags_none')}
                    </div>
                ) : null}
            </Headless.ComboboxOptions>
        </Headless.Combobox>
    );
}
