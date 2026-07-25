import type { AiProviderValue } from '@/lib/api/integrations';

export type AiModelTier = 'auto' | 'fast' | 'expert' | 'custom';

export type AiModelPreset = {
    tier: Exclude<AiModelTier, 'custom'>;
    /** null means package default (Default tier). */
    model: string | null;
    labelKey: string;
    labelFallback: string;
    descriptionKey: string;
    descriptionFallback: string;
};

export type IntegrationDeveloper = {
    name: string;
    websiteUrl: string;
    websiteLabel: string;
};

export type AiProviderOption = {
    value: AiProviderValue;
    label: string;
    defaultModel: string;
    expertModel: string;
    presets: AiModelPreset[];
    consoleUrl: string;
    consoleLabel: string;
    usageUrl: string;
    usageLabel: string;
    developer: IntegrationDeveloper;
};

export const UNSPLASH_DEVELOPER: IntegrationDeveloper = {
    name: 'Unsplash',
    websiteUrl: 'https://unsplash.com',
    websiteLabel: 'unsplash.com',
};

function buildPresets(defaultModel: string, expertModel: string): AiModelPreset[] {
    return [
        {
            tier: 'auto',
            model: null,
            labelKey: 'integrations.model_tier_auto',
            labelFallback: 'Default',
            descriptionKey: 'integrations.model_tier_auto_help',
            descriptionFallback: 'Provider default · recommended for rewrites and SEO',
        },
        {
            tier: 'fast',
            model: defaultModel,
            labelKey: 'integrations.model_tier_fast',
            labelFallback: 'Fast',
            descriptionKey: 'integrations.model_tier_fast_help',
            descriptionFallback: 'Same as the provider default · optimized for speed',
        },
        {
            tier: 'expert',
            model: expertModel,
            labelKey: 'integrations.model_tier_expert',
            labelFallback: 'Expert',
            descriptionKey: 'integrations.model_tier_expert_help',
            descriptionFallback: 'Higher-capacity model · better quality, can be slower',
        },
    ];
}

export const AI_PROVIDER_OPTIONS: AiProviderOption[] = [
    {
        value: 'xai',
        label: 'Grok (xAI)',
        defaultModel: 'grok-4.3',
        expertModel: 'grok-4.5',
        presets: buildPresets('grok-4.3', 'grok-4.5'),
        consoleUrl: 'https://console.x.ai',
        consoleLabel: 'console.x.ai',
        usageUrl: 'https://console.x.ai',
        usageLabel: 'console.x.ai',
        developer: {
            name: 'xAI',
            websiteUrl: 'https://x.ai',
            websiteLabel: 'x.ai',
        },
    },
    {
        value: 'openai',
        label: 'ChatGPT (OpenAI)',
        defaultModel: 'gpt-4o-mini',
        expertModel: 'gpt-5.6-terra',
        presets: buildPresets('gpt-4o-mini', 'gpt-5.6-terra'),
        consoleUrl: 'https://platform.openai.com/api-keys',
        consoleLabel: 'platform.openai.com',
        usageUrl: 'https://platform.openai.com/usage',
        usageLabel: 'platform.openai.com/usage',
        developer: {
            name: 'OpenAI',
            websiteUrl: 'https://openai.com',
            websiteLabel: 'openai.com',
        },
    },
    {
        value: 'anthropic',
        label: 'Claude (Anthropic)',
        defaultModel: 'claude-haiku-4-5',
        expertModel: 'claude-sonnet-5',
        presets: buildPresets('claude-haiku-4-5', 'claude-sonnet-5'),
        consoleUrl: 'https://console.anthropic.com/settings/keys',
        consoleLabel: 'console.anthropic.com',
        usageUrl: 'https://console.anthropic.com/settings/usage',
        usageLabel: 'console.anthropic.com/usage',
        developer: {
            name: 'Anthropic',
            websiteUrl: 'https://anthropic.com',
            websiteLabel: 'anthropic.com',
        },
    },
];

export function aiProviderOption(value: AiProviderValue | null | undefined): AiProviderOption | null {
    if (value == null) {
        return null;
    }

    return AI_PROVIDER_OPTIONS.find((option) => option.value === value) ?? null;
}

/**
 * Map a stored model override (null = Default) to a UI tier selection.
 * Unknown ids resolve to Custom so existing free-text values keep working.
 */
export function resolveModelTier(
    provider: AiProviderValue | null | undefined,
    storedModel: string | null | undefined
): AiModelTier {
    if (provider == null) {
        return 'auto';
    }

    const option = aiProviderOption(provider);

    if (option === null) {
        return 'auto';
    }

    const trimmed = storedModel?.trim() ?? '';

    if (trimmed === '') {
        return 'auto';
    }

    for (const preset of option.presets) {
        if (preset.tier !== 'auto' && preset.model === trimmed) {
            return preset.tier;
        }
    }

    return 'custom';
}

/** Model id to persist: null for Default, preset model for Fast/Expert, custom string otherwise. */
export function modelIdForTier(
    provider: AiProviderValue | null | undefined,
    tier: AiModelTier,
    customModel: string
): string | null {
    if (tier === 'auto' || provider == null) {
        return null;
    }

    if (tier === 'custom') {
        const trimmed = customModel.trim();

        return trimmed === '' ? null : trimmed;
    }

    const option = aiProviderOption(provider);
    const preset = option?.presets.find((item) => item.tier === tier);

    return preset?.model ?? null;
}

/** Human label for Integrations list / drawer hero (tier-first, SKU only for Custom). */
export function modelTierLabel(
    provider: AiProviderValue | null | undefined,
    storedModel: string | null | undefined,
    labels?: { auto?: string; fast?: string; expert?: string; custom?: string }
): string | null {
    if (provider == null) {
        return null;
    }

    const tier = resolveModelTier(provider, storedModel);

    if (tier === 'auto') {
        return labels?.auto ?? 'Default';
    }

    if (tier === 'fast') {
        return labels?.fast ?? 'Fast';
    }

    if (tier === 'expert') {
        return labels?.expert ?? 'Expert';
    }

    const custom = storedModel?.trim() ?? '';
    const customLabel = labels?.custom ?? 'Custom';

    if (custom === '') {
        return customLabel;
    }

    return `${customLabel} · ${custom}`;
}

export function integrationsAiMeta(
    provider: AiProviderValue | null | undefined,
    storedModel: string | null | undefined,
    labels?: { auto?: string; fast?: string; expert?: string; custom?: string }
): string | undefined {
    const option = aiProviderOption(provider);

    if (option === null) {
        return undefined;
    }

    const tier = modelTierLabel(provider, storedModel, labels);

    return [option.label, tier].filter(Boolean).join(' · ') || undefined;
}
