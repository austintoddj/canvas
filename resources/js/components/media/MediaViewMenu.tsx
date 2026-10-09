import {
    Dropdown,
    DropdownButton,
    DropdownDivider,
    DropdownHeading,
    DropdownItem,
    DropdownSection,
    DropdownLabel,
    DropdownMenu,
    DropdownTrailingIcon,
    dropdownInsetItemClass,
} from '@/components/dropdown';
import { useCanvas } from '@/hooks/useCanvas';
import { MEDIA_MIME_FILTERS, MEDIA_SORT_OPTIONS, type MediaListSort, type MediaMimeFilter } from '@/lib/media/list';
import { IconAdjustmentsHorizontal, IconCheck } from '@tabler/icons-react';

type MediaViewMenuProps = {
    mime: MediaMimeFilter;
    sort: MediaListSort;
    onMimeChange: (mime: MediaMimeFilter) => void;
    onSortChange: (sort: MediaListSort) => void;
};

export function MediaViewMenu({ mime, sort, onMimeChange, onSortChange }: MediaViewMenuProps) {
    const { t } = useCanvas();
    const active = mime !== '' || sort !== 'newest';

    return (
        <Dropdown>
            <DropdownButton
                as="button"
                type="button"
                aria-label={`${t('media.file_type')}, ${t('media.sort_label')}`}
                data-media-view-menu="true"
                className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-950/5 hover:text-zinc-800 focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:size-8 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
            >
                <IconAdjustmentsHorizontal className="size-4" aria-hidden="true" />
                {active ? (
                    <span className="absolute top-1 right-1 size-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                ) : null}
            </DropdownButton>
            <DropdownMenu anchor="bottom end">
                <DropdownSection>
                    <DropdownHeading>{t('media.file_type')}</DropdownHeading>
                    {MEDIA_MIME_FILTERS.map((option) => {
                        const selected = mime === option.value;
                        const label = option.labelKey !== undefined ? t(option.labelKey) : (option.label ?? '');

                        return (
                            <DropdownItem
                                key={option.value || 'all'}
                                className={dropdownInsetItemClass}
                                onClick={() => onMimeChange(option.value)}
                            >
                                <DropdownLabel>{label}</DropdownLabel>
                                {selected ? (
                                    <DropdownTrailingIcon>
                                        <IconCheck className="size-4 text-zinc-950 dark:text-white" />
                                    </DropdownTrailingIcon>
                                ) : null}
                            </DropdownItem>
                        );
                    })}
                </DropdownSection>
                <DropdownDivider />
                <DropdownSection>
                    <DropdownHeading>{t('media.sort_label')}</DropdownHeading>
                    {MEDIA_SORT_OPTIONS.map((option) => {
                        const selected = sort === option.value;

                        return (
                            <DropdownItem
                                key={option.value}
                                className={dropdownInsetItemClass}
                                onClick={() => onSortChange(option.value)}
                            >
                                <DropdownLabel>{t(option.labelKey)}</DropdownLabel>
                                {selected ? (
                                    <DropdownTrailingIcon>
                                        <IconCheck className="size-4 text-zinc-950 dark:text-white" />
                                    </DropdownTrailingIcon>
                                ) : null}
                            </DropdownItem>
                        );
                    })}
                </DropdownSection>
            </DropdownMenu>
        </Dropdown>
    );
}
