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
import type { AiProviderValue } from '@/lib/api/integrations';
import { AI_PROVIDER_OPTIONS, aiProviderOption } from '@/lib/integrations/ai-providers';

type AiProviderDropdownProps = {
    value: AiProviderValue | null;
    onChange: (value: AiProviderValue) => void;
    disabled?: boolean;
    invalid?: boolean;
    emptyLabel?: string;
};

export function AiProviderDropdown({
    value,
    onChange,
    disabled = false,
    invalid = false,
    emptyLabel = 'Select a provider',
}: AiProviderDropdownProps) {
    const selected = aiProviderOption(value);

    return (
        <Dropdown>
            <DropdownButton
                outline
                disabled={disabled}
                data-invalid={invalid ? true : undefined}
                aria-invalid={invalid || undefined}
                className={clsx(
                    selectDropdownTriggerCompactClass,
                    selected === null && 'text-zinc-500 dark:text-zinc-400',
                    invalid && 'border-red-500 dark:border-red-600'
                )}
            >
                <span className="min-w-0 truncate text-left">{selected?.label ?? emptyLabel}</span>
                <ChevronDownIcon data-slot="icon" className="shrink-0" />
            </DropdownButton>
            <DropdownMenu anchor="bottom start" className={selectDropdownMenuClass}>
                {AI_PROVIDER_OPTIONS.map((option) => {
                    const isSelected = value === option.value;

                    return (
                        <DropdownItem
                            key={option.value}
                            disabled={disabled}
                            onClick={() => onChange(option.value)}
                            className={dropdownInsetItemClass}
                        >
                            <DropdownLabel>{option.label}</DropdownLabel>
                            {isSelected ? (
                                <DropdownTrailingIcon>
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
