import clsx from 'clsx';
import { useMemo } from 'react';

import {
    Dropdown,
    DropdownButton,
    DropdownDivider,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
} from '@/components/dropdown';
import { useCanvas } from '@/hooks/useCanvas';
import type { MediaTag } from '@/types/api';
import { IconDots, IconPlus } from '@tabler/icons-react';

const MAX_VISIBLE_TAGS = 4;

type MediaTagRailProps = {
    tags: MediaTag[];
    allCount: number;
    untaggedCount: number;
    selectedTagId: string | null;
    untagged: boolean;
    canManage: boolean;
    onSelectAll: () => void;
    onSelectUntagged: () => void;
    onSelectTag: (tag: MediaTag) => void;
    onCreate?: () => void;
    onRename?: (tag: MediaTag) => void;
    onDelete?: (tag: MediaTag) => void;
};

function tagPillClass(selected: boolean): string {
    return clsx(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[13px] font-medium transition',
        'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        selected
            ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
            : 'bg-zinc-950/5 text-zinc-700 hover:bg-zinc-950/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15'
    );
}

function visibleMediaTags(tags: MediaTag[], selectedTagId: string | null): MediaTag[] {
    if (tags.length <= MAX_VISIBLE_TAGS) {
        return tags;
    }

    const selected = tags.find((tag) => tag.id === selectedTagId);

    if (selected === undefined) {
        return tags.slice(0, MAX_VISIBLE_TAGS);
    }

    const rest = tags.filter((tag) => tag.id !== selected.id);

    return [selected, ...rest].slice(0, MAX_VISIBLE_TAGS);
}

export function MediaTagRail({
    tags,
    allCount,
    untaggedCount,
    selectedTagId,
    untagged,
    canManage,
    onSelectAll,
    onSelectUntagged,
    onSelectTag,
    onCreate,
    onRename,
    onDelete,
}: MediaTagRailProps) {
    const { t } = useCanvas();
    const allSelected = selectedTagId === null && !untagged;
    const selectedTag = tags.find((tag) => tag.id === selectedTagId) ?? null;
    const visibleTags = useMemo(() => visibleMediaTags(tags, selectedTagId), [selectedTagId, tags]);
    const overflowTags = useMemo(() => {
        const visibleIds = new Set(visibleTags.map((tag) => tag.id));

        return tags.filter((tag) => !visibleIds.has(tag.id));
    }, [tags, visibleTags]);
    const showManage = canManage && selectedTag !== null && onRename !== undefined && onDelete !== undefined;

    return (
        <nav
            className="flex min-w-0 items-center gap-2 overflow-x-auto"
            aria-label={t('media.tags')}
            data-media-tag-rail="true"
            data-media-tag-filter="true"
        >
            <button
                type="button"
                aria-pressed={allSelected}
                aria-current={allSelected ? 'true' : undefined}
                className={tagPillClass(allSelected)}
                onClick={onSelectAll}
            >
                {t('media.tags_all')}
            </button>
            <button
                type="button"
                aria-pressed={untagged}
                aria-current={untagged ? 'true' : undefined}
                title={`${t('media.tags_untagged')} (${untaggedCount})`}
                className={tagPillClass(untagged)}
                onClick={onSelectUntagged}
            >
                {t('media.tags_untagged')}
            </button>
            {visibleTags.map((tag) => (
                <button
                    key={tag.id}
                    type="button"
                    aria-pressed={selectedTagId === tag.id}
                    aria-current={selectedTagId === tag.id ? 'true' : undefined}
                    title={`${tag.name} (${tag.media_count ?? 0})`}
                    className={tagPillClass(selectedTagId === tag.id)}
                    onClick={() => onSelectTag(tag)}
                >
                    {tag.name}
                </button>
            ))}
            <Dropdown>
                <DropdownButton
                    as="button"
                    type="button"
                    className={tagPillClass(false)}
                    aria-label={t('media.tags_filter')}
                >
                    <IconDots className="size-4" aria-hidden="true" />
                </DropdownButton>
                <DropdownMenu anchor="bottom start">
                    {overflowTags.map((tag) => (
                        <DropdownItem key={tag.id} onClick={() => onSelectTag(tag)}>
                            <DropdownLabel>
                                {tag.name}
                                <span className="ml-2 text-zinc-400 tabular-nums">{tag.media_count ?? 0}</span>
                            </DropdownLabel>
                        </DropdownItem>
                    ))}
                    {overflowTags.length > 0 && (onCreate || showManage) ? <DropdownDivider /> : null}
                    {onCreate ? (
                        <DropdownItem onClick={onCreate}>
                            <IconPlus data-slot="icon" />
                            <DropdownLabel>{t('media.tags_new')}</DropdownLabel>
                        </DropdownItem>
                    ) : null}
                    {showManage && selectedTag !== null ? (
                        <>
                            {onCreate ? <DropdownDivider /> : null}
                            <DropdownItem onClick={() => onRename(selectedTag)}>
                                <DropdownLabel>{t('media.tags_rename')}</DropdownLabel>
                            </DropdownItem>
                            <DropdownItem onClick={() => onDelete(selectedTag)}>
                                <DropdownLabel>{t('media.tags_delete')}</DropdownLabel>
                            </DropdownItem>
                        </>
                    ) : null}
                </DropdownMenu>
            </Dropdown>
            <span className="sr-only">
                {t('media.tags_all')} {allCount}
            </span>
        </nav>
    );
}
