import type { AiProviderValue } from '@/lib/api/integrations';

export type AiProviderOption = {
    value: AiProviderValue;
    label: string;
    defaultModel: string;
    consoleUrl: string;
    consoleLabel: string;
    usageUrl: string;
    usageLabel: string;
};

export const AI_PROVIDER_OPTIONS: AiProviderOption[] = [
    {
        value: 'xai',
        label: 'Grok (xAI)',
        defaultModel: 'grok-4-fast-non-reasoning',
        consoleUrl: 'https://console.x.ai',
        consoleLabel: 'console.x.ai',
        usageUrl: 'https://console.x.ai',
        usageLabel: 'console.x.ai',
    },
    {
        value: 'openai',
        label: 'ChatGPT (OpenAI)',
        defaultModel: 'gpt-4o-mini',
        consoleUrl: 'https://platform.openai.com/api-keys',
        consoleLabel: 'platform.openai.com',
        usageUrl: 'https://platform.openai.com/usage',
        usageLabel: 'platform.openai.com/usage',
    },
    {
        value: 'anthropic',
        label: 'Claude (Anthropic)',
        defaultModel: 'claude-haiku-4-5',
        consoleUrl: 'https://console.anthropic.com/settings/keys',
        consoleLabel: 'console.anthropic.com',
        usageUrl: 'https://console.anthropic.com/settings/usage',
        usageLabel: 'console.anthropic.com/usage',
    },
];

export function aiProviderOption(value: AiProviderValue | null | undefined): AiProviderOption | null {
    if (value == null) {
        return null;
    }

    return AI_PROVIDER_OPTIONS.find((option) => option.value === value) ?? null;
}
