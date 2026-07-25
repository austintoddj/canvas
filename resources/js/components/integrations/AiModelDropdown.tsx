import clsx from 'clsx';

import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownMenu,
    selectDropdownMenuClass,
    selectDropdownTriggerCompactClass,
} from '@/components/dropdown';
import type { AiProviderValue } from '@/lib/api/integrations';
import type { Translate } from '@/lib/canvas-context-value';
import { aiProviderOption, type AiModelTier, type AiModelPreset } from '@/lib/integrations/ai-providers';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';

type AiModelDropdownProps = {
    provider: AiProviderValue | null;
    value: AiModelTier;
    onChange: (tier: AiModelTier) => void;
    disabled?: boolean;
    invalid?: boolean;
    t: Translate;
};

function presetDescription(preset: AiModelPreset, t: Translate): string {
    return t(preset.descriptionKey, preset.descriptionFallback);
}

function ModelOptionContent({
    label,
    description,
    sku,
    selected,
}: {
    label: string;
    description: string;
    sku?: string | null;
    selected: boolean;
}) {
    return (
        <span className="flex w-full min-w-0 items-start gap-2">
            <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm/6 font-medium text-zinc-950 dark:text-white">{label}</span>
                <span className="mt-0.5 block text-xs/5 text-zinc-500 dark:text-zinc-400">{description}</span>
                {sku ? (
                    <span className="mt-0.5 block font-mono text-[0.7rem] text-zinc-400 dark:text-zinc-500">{sku}</span>
                ) : null}
            </span>
            {selected ? (
                <IconCheck className="mt-0.5 size-4 shrink-0 text-zinc-950 dark:text-white" aria-hidden="true" />
            ) : (
                <span className="size-4 shrink-0" aria-hidden="true" />
            )}
        </span>
    );
}

export function AiModelDropdown({
    provider,
    value,
    onChange,
    disabled = false,
    invalid = false,
    t,
}: AiModelDropdownProps) {
    const option = aiProviderOption(provider);
    const presets = option?.presets ?? [];
    const selectedPreset = presets.find((preset) => preset.tier === value);
    const triggerLabel =
        value === 'custom'
            ? t('integrations.model_tier_custom', 'Custom')
            : selectedPreset !== undefined
              ? t(selectedPreset.labelKey, selectedPreset.labelFallback)
              : t('integrations.model_tier_auto', 'Default');

    const isDisabled = disabled || option === null;

    return (
        <Dropdown>
            <DropdownButton
                outline
                disabled={isDisabled}
                data-invalid={invalid ? true : undefined}
                aria-invalid={invalid || undefined}
                className={clsx(
                    selectDropdownTriggerCompactClass,
                    isDisabled && 'opacity-60',
                    invalid && 'border-red-500 dark:border-red-600'
                )}
            >
                <span className="min-w-0 truncate text-left">{triggerLabel}</span>
                <IconChevronDown data-slot="icon" className="shrink-0" />
            </DropdownButton>
            <DropdownMenu anchor="bottom start" className={clsx(selectDropdownMenuClass, 'min-w-72')}>
                {presets.map((preset) => {
                    const isSelected = value === preset.tier;
                    const sku = preset.tier === 'auto' ? (option?.defaultModel ?? null) : (preset.model ?? null);

                    return (
                        <DropdownItem
                            key={preset.tier}
                            disabled={isDisabled}
                            onClick={() => onChange(preset.tier)}
                            className="!flex items-start"
                        >
                            <ModelOptionContent
                                label={t(preset.labelKey, preset.labelFallback)}
                                description={presetDescription(preset, t)}
                                sku={sku}
                                selected={isSelected}
                            />
                        </DropdownItem>
                    );
                })}
                <DropdownItem disabled={isDisabled} onClick={() => onChange('custom')} className="!flex items-start">
                    <ModelOptionContent
                        label={t('integrations.model_tier_custom', 'Custom')}
                        description={t('integrations.model_tier_custom_help', 'Any model id from the provider API')}
                        selected={value === 'custom'}
                    />
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
}
