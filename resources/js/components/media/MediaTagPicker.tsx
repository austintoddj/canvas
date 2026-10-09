import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import { useMemo, useRef, useState } from 'react';

import { useCanvas } from '@/hooks/useCanvas';
import type { MediaTag } from '@/types/api';

const CREATE_CHOICE_ID = '__create__';

type MediaTagPickerProps = {
    tags: MediaTag[];
    excludeIds?: ReadonlySet<string>;
    disabled?: boolean;
    /** `menu` drops the nested card so the picker can sit inside a popover. */
    variant?: 'field' | 'menu';
    onPick: (tag: MediaTag) => void;
    onCreate: (name: string) => Promise<void>;
};

export function MediaTagPicker({
    tags,
    excludeIds,
    disabled = false,
    variant = 'field',
    onPick,
    onCreate,
}: MediaTagPickerProps) {
    const { t } = useCanvas();
    const [query, setQuery] = useState('');
    const [creating, setCreating] = useState(false);
    const creatingRef = useRef(false);
    const menu = variant === 'menu';
    const label = menu ? t('media.tags_query') : t('media.tags_add');

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
    const createName = query.trim();

    async function handleCreate(name: string) {
        const trimmed = name.trim();

        if (trimmed === '' || creatingRef.current) {
            return;
        }

        creatingRef.current = true;
        setCreating(true);

        try {
            await onCreate(trimmed);
            setQuery('');
        } finally {
            creatingRef.current = false;
            setCreating(false);
        }
    }

    function pickTag(tag: MediaTag) {
        onPick(tag);
        setQuery('');
    }

    return (
        <Headless.Combobox
            disabled={disabled || creating}
            onChange={(choice: string | null) => {
                if (choice === null) {
                    return;
                }

                if (choice === CREATE_CHOICE_ID) {
                    void handleCreate(createName);
                    return;
                }

                const tag = available.find((item) => item.id === choice);

                if (tag !== undefined) {
                    pickTag(tag);
                }
            }}
        >
            {({ activeOption }) => (
                <>
                    <Headless.ComboboxInput
                        disabled={disabled || creating}
                        value={query}
                        aria-label={label}
                        placeholder={label}
                        className={
                            menu
                                ? 'w-full rounded-lg border-none bg-white px-2.5 py-1.5 text-sm text-zinc-950 ring-1 ring-zinc-950/10 outline-hidden placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-white dark:ring-white/10 dark:placeholder:text-zinc-500'
                                : 'w-full rounded-lg border-none bg-white px-3 py-2 text-sm text-zinc-950 ring-1 ring-zinc-950/10 outline-hidden placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white dark:ring-white/10 dark:placeholder:text-zinc-500'
                        }
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key !== 'Enter' || event.nativeEvent.isComposing || activeOption !== null) {
                                return;
                            }

                            if (filtered.length === 0 && canCreate) {
                                event.preventDefault();
                                void handleCreate(createName);
                                return;
                            }

                            if (filtered.length === 1 && !canCreate) {
                                event.preventDefault();
                                pickTag(filtered[0]);
                            }
                        }}
                    />
                    <Headless.ComboboxOptions
                        static
                        className={
                            menu
                                ? 'mt-1 max-h-56 overflow-y-auto'
                                : 'mt-1 max-h-56 overflow-y-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-800 dark:ring-white/10'
                        }
                    >
                        {filtered.map((tag) => (
                            <Headless.ComboboxOption
                                key={tag.id}
                                value={tag.id}
                                className={({ focus }) =>
                                    clsx(
                                        'cursor-pointer text-sm',
                                        menu ? 'rounded-lg px-2.5 py-1.5' : 'px-3 py-2',
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
                            <Headless.ComboboxOption
                                value={CREATE_CHOICE_ID}
                                className={({ focus }) =>
                                    clsx(
                                        'cursor-pointer text-sm text-zinc-950 dark:text-white',
                                        menu ? 'rounded-lg px-2.5 py-1.5' : 'px-3 py-2',
                                        focus && 'bg-zinc-950/5 dark:bg-white/10'
                                    )
                                }
                            >
                                {t('media.tags_create', { name: createName })}
                            </Headless.ComboboxOption>
                        ) : null}
                        {filtered.length === 0 && !canCreate ? (
                            <div
                                className={clsx(
                                    'text-sm text-canvas-muted dark:text-canvas-muted-dark',
                                    menu ? 'px-2.5 py-1.5' : 'px-3 py-2'
                                )}
                            >
                                {t('media.tags_none')}
                            </div>
                        ) : null}
                    </Headless.ComboboxOptions>
                </>
            )}
        </Headless.Combobox>
    );
}
