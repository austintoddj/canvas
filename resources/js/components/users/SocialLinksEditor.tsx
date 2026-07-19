import { useId, useState, type ComponentType, type SVGProps } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/button';
import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownTrailingIcon,
    selectDropdownMenuClass,
    selectDropdownTriggerCompactClass,
} from '@/components/dropdown';
import { ErrorMessage, Field, FieldGroup } from '@/components/fieldset';
import { Input } from '@/components/input';
import type { LaravelValidationErrors } from '@/lib/api';
import {
    SOCIAL_FIELD_KEYS,
    SOCIAL_LABELS,
    SOCIAL_PLACEHOLDERS,
    emptySocial,
    type SocialFieldKey,
} from '@/lib/settings/profile';
import {
    IconBrandBluesky,
    IconBrandFacebook,
    IconBrandGithub,
    IconBrandInstagram,
    IconBrandMedium,
    IconBrandX,
    IconCheck,
    IconChevronDown,
    IconPlus,
    IconX,
} from '@tabler/icons-react';

type SocialIcon = ComponentType<SVGProps<SVGSVGElement>>;

const SOCIAL_ICONS: Record<SocialFieldKey, SocialIcon> = {
    facebook: IconBrandFacebook,
    instagram: IconBrandInstagram,
    bluesky: IconBrandBluesky,
    x: IconBrandX,
    github: IconBrandGithub,
    medium: IconBrandMedium,
};

type SocialLinkRow = {
    id: string;
    platform: SocialFieldKey | null;
    value: string;
};

type SocialLinksEditorProps = {
    social: Record<SocialFieldKey, string>;
    fieldErrors: LaravelValidationErrors;
    onChange: (social: Record<SocialFieldKey, string>) => void;
};

function newRowId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function rowsFromSocial(social: Record<SocialFieldKey, string>): SocialLinkRow[] {
    const filled = SOCIAL_FIELD_KEYS.filter((key) => social[key].trim() !== '').map((key) => ({
        id: key,
        platform: key,
        value: social[key],
    }));

    if (filled.length === 0) {
        return [{ id: newRowId(), platform: null, value: '' }];
    }

    return filled;
}

function socialFromRows(rows: SocialLinkRow[]): Record<SocialFieldKey, string> {
    const next = emptySocial();

    for (const row of rows) {
        if (row.platform === null) {
            continue;
        }

        next[row.platform] = row.value;
    }

    return next;
}

function PlatformSelectDropdown({
    value,
    usedPlatforms,
    onChange,
    invalid,
}: {
    value: SocialFieldKey | null;
    usedPlatforms: Set<SocialFieldKey>;
    onChange: (platform: SocialFieldKey) => void;
    invalid?: boolean;
}) {
    const options = SOCIAL_FIELD_KEYS.filter((key) => key === value || !usedPlatforms.has(key));
    const SelectedIcon = value === null ? null : SOCIAL_ICONS[value];

    return (
        <Dropdown>
            <DropdownButton
                outline
                data-invalid={invalid ? true : undefined}
                aria-invalid={invalid || undefined}
                className={clsx(
                    selectDropdownTriggerCompactClass,
                    'w-full min-w-0',
                    value === null && 'text-zinc-500 dark:text-zinc-400',
                    invalid && 'border-red-500 dark:border-red-600'
                )}
            >
                <span className="flex min-w-0 items-center gap-x-2">
                    {SelectedIcon ? (
                        <SelectedIcon aria-hidden className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                    ) : null}
                    <span className="min-w-0 truncate text-left">
                        {value === null ? 'Select platform' : SOCIAL_LABELS[value]}
                    </span>
                </span>
                <IconChevronDown data-slot="icon" className="shrink-0" />
            </DropdownButton>
            <DropdownMenu anchor="bottom start" className={selectDropdownMenuClass}>
                {options.map((key) => {
                    const selected = value === key;
                    const Icon = SOCIAL_ICONS[key];

                    return (
                        <DropdownItem key={key} onClick={() => onChange(key)}>
                            <Icon data-slot="icon" />
                            <DropdownLabel>{SOCIAL_LABELS[key]}</DropdownLabel>
                            {selected ? (
                                <DropdownTrailingIcon>
                                    <IconCheck className="size-4 text-zinc-950 dark:text-white" />
                                </DropdownTrailingIcon>
                            ) : null}
                        </DropdownItem>
                    );
                })}
            </DropdownMenu>
        </Dropdown>
    );
}

export function SocialLinksEditor({ social, fieldErrors, onChange }: SocialLinksEditorProps) {
    const baseId = useId();
    const [rows, setRows] = useState<SocialLinkRow[]>(() => rowsFromSocial(social));

    const usedPlatforms = new Set(rows.flatMap((row) => (row.platform === null ? [] : [row.platform])));
    const canAddMore = rows.length < SOCIAL_FIELD_KEYS.length && usedPlatforms.size < SOCIAL_FIELD_KEYS.length;

    function commit(nextRows: SocialLinkRow[]) {
        setRows(nextRows);
        onChange(socialFromRows(nextRows));
    }

    function updateRow(id: string, patch: Partial<Pick<SocialLinkRow, 'platform' | 'value'>>) {
        commit(
            rows.map((row) => {
                if (row.id !== id) {
                    return row;
                }

                return { ...row, ...patch };
            })
        );
    }

    function removeRow(id: string) {
        if (rows.length === 1) {
            commit([{ id: newRowId(), platform: null, value: '' }]);
            return;
        }

        commit(rows.filter((row) => row.id !== id));
    }

    function addRow() {
        if (!canAddMore) {
            return;
        }

        commit([...rows, { id: newRowId(), platform: null, value: '' }]);
    }

    return (
        <FieldGroup>
            {rows.map((row) => {
                const platformErrorKey = row.platform === null ? null : `social.${row.platform}`;
                const rowInvalid = Boolean(
                    (platformErrorKey !== null && fieldErrors[platformErrorKey]) || fieldErrors.social
                );
                const showRemove = rows.length > 1 || row.platform !== null || row.value.trim() !== '';

                return (
                    <Field key={row.id}>
                        <div className="flex flex-row items-center gap-2">
                            <div className="w-[9.5rem] shrink-0 sm:w-40">
                                <PlatformSelectDropdown
                                    value={row.platform}
                                    usedPlatforms={usedPlatforms}
                                    onChange={(platform) => updateRow(row.id, { platform })}
                                    invalid={rowInvalid}
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <Input
                                    id={`${baseId}-${row.id}`}
                                    name={row.platform === null ? `social-row-${row.id}` : `social.${row.platform}`}
                                    type="text"
                                    autoComplete="username"
                                    value={row.value}
                                    onChange={(event) => updateRow(row.id, { value: event.target.value })}
                                    invalid={rowInvalid}
                                    placeholder={row.platform === null ? 'username' : SOCIAL_PLACEHOLDERS[row.platform]}
                                    aria-label={
                                        row.platform === null
                                            ? 'Social profile username'
                                            : `${SOCIAL_LABELS[row.platform]} username`
                                    }
                                />
                            </div>
                            {showRemove ? (
                                <Button
                                    type="button"
                                    plain
                                    aria-label="Remove social link"
                                    className="shrink-0"
                                    onClick={() => removeRow(row.id)}
                                >
                                    <IconX data-slot="icon" />
                                </Button>
                            ) : null}
                        </div>
                        {platformErrorKey !== null && fieldErrors[platformErrorKey]?.[0] ? (
                            <ErrorMessage>{fieldErrors[platformErrorKey][0]}</ErrorMessage>
                        ) : null}
                    </Field>
                );
            })}

            {canAddMore ? (
                <div>
                    <Button type="button" outline onClick={addRow}>
                        <IconPlus data-slot="icon" />
                        Add more
                    </Button>
                </div>
            ) : null}

            {fieldErrors.social?.[0] && !rows.some((row) => row.platform !== null) ? (
                <ErrorMessage>{fieldErrors.social[0]}</ErrorMessage>
            ) : null}
        </FieldGroup>
    );
}
