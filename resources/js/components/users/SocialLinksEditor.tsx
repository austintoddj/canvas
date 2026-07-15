import { useId, useState } from 'react';
import { CheckIcon, ChevronDownIcon, PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

import { Button } from '@/components/button';
import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownTrailingIcon,
    dropdownInsetItemClass,
    selectDropdownTriggerClass,
} from '@/components/dropdown';
import { ErrorMessage, Field, FieldGroup } from '@/components/fieldset';
import { Input } from '@/components/input';
import type { LaravelValidationErrors } from '@/lib/api';
import { SOCIAL_FIELD_KEYS, SOCIAL_LABELS, emptySocial, type SocialFieldKey } from '@/lib/settings/profile';

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

    return (
        <Dropdown>
            <DropdownButton
                outline
                data-invalid={invalid ? true : undefined}
                aria-invalid={invalid || undefined}
                className={clsx(
                    selectDropdownTriggerClass,
                    value === null && 'text-zinc-500 dark:text-zinc-400',
                    invalid && 'border-red-500 dark:border-red-600'
                )}
            >
                <span className="min-w-0 truncate text-left">
                    {value === null ? 'Select platform' : SOCIAL_LABELS[value]}
                </span>
                <ChevronDownIcon data-slot="icon" className="shrink-0" />
            </DropdownButton>
            <DropdownMenu anchor="bottom start" className="z-50 min-w-44 max-w-sm">
                {options.map((key) => {
                    const selected = value === key;

                    return (
                        <DropdownItem key={key} onClick={() => onChange(key)} className={dropdownInsetItemClass}>
                            <DropdownLabel inset>{SOCIAL_LABELS[key]}</DropdownLabel>
                            {selected ? (
                                <DropdownTrailingIcon inset>
                                    <CheckIcon className="size-4 text-zinc-950 dark:text-white" />
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
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                            <div className="w-full sm:w-40 sm:shrink-0">
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
                                    type="url"
                                    value={row.value}
                                    onChange={(event) => updateRow(row.id, { value: event.target.value })}
                                    invalid={rowInvalid}
                                    placeholder="https://"
                                    aria-label={
                                        row.platform === null
                                            ? 'Social profile URL'
                                            : `${SOCIAL_LABELS[row.platform]} profile URL`
                                    }
                                />
                            </div>
                            {showRemove ? (
                                <Button
                                    type="button"
                                    plain
                                    aria-label="Remove social link"
                                    className="self-start sm:mt-0.5"
                                    onClick={() => removeRow(row.id)}
                                >
                                    <XMarkIcon data-slot="icon" />
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
                        <PlusIcon data-slot="icon" />
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
