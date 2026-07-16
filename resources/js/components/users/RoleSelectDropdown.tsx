import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownTrailingIcon,
    dropdownInsetItemClass,
    selectDropdownMenuClass,
    selectDropdownTriggerCompactClass,
} from '@/components/dropdown';
import type { RoleValue } from '@/lib/permissions';
import { ROLE_OPTIONS, roleLabel } from '@/lib/users/roles';

type RoleSelectDropdownProps = {
    value: RoleValue | null;
    onChange: (role: RoleValue) => void;
    labels?: Record<number, string>;
    disabled?: boolean;
    invalid?: boolean;
    emptyLabel?: string;
};

export function RoleSelectDropdown({
    value,
    onChange,
    labels,
    disabled = false,
    invalid = false,
    emptyLabel = 'Select a role',
}: RoleSelectDropdownProps) {
    const selectedLabel = value === null ? null : roleLabel(value, labels);

    return (
        <Dropdown>
            <DropdownButton
                outline
                disabled={disabled}
                data-invalid={invalid ? true : undefined}
                aria-invalid={invalid || undefined}
                className={clsx(
                    selectDropdownTriggerCompactClass,
                    selectedLabel === null && 'text-zinc-500 dark:text-zinc-400',
                    invalid && 'border-red-500 dark:border-red-600'
                )}
            >
                <span className="min-w-0 truncate text-left">{selectedLabel ?? emptyLabel}</span>
                <ChevronDownIcon data-slot="icon" className="shrink-0" />
            </DropdownButton>
            <DropdownMenu anchor="bottom start" className={selectDropdownMenuClass}>
                {ROLE_OPTIONS.map((option) => {
                    const label = labels?.[option.value] ?? option.label;
                    const selected = value === option.value;

                    return (
                        <DropdownItem
                            key={option.value}
                            disabled={disabled}
                            onClick={() => onChange(option.value)}
                            className={dropdownInsetItemClass}
                        >
                            <DropdownLabel inset>{label}</DropdownLabel>
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
