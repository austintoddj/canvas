<?php

declare(strict_types=1);

namespace Canvas\Enums;

enum AiProvider: string
{
    case Xai = 'xai';
    case OpenAi = 'openai';
    case Anthropic = 'anthropic';

    public function label(): string
    {
        return match ($this) {
            self::Xai => 'Grok (xAI)',
            self::OpenAi => 'ChatGPT (OpenAI)',
            self::Anthropic => 'Claude (Anthropic)',
        };
    }

    public function baseUrl(): string
    {
        return match ($this) {
            self::Xai => 'https://api.x.ai/v1',
            self::OpenAi => 'https://api.openai.com/v1',
            self::Anthropic => 'https://api.anthropic.com',
        };
    }

    /**
     * Fast defaults for editor rewrite/SEO latency.
     * Prefer mini/haiku/fast SKUs over flagship thinking models.
     */
    public function defaultModel(): string
    {
        return match ($this) {
            self::Xai => 'grok-4.3',
            self::OpenAi => 'gpt-4o-mini',
            self::Anthropic => 'claude-haiku-4-5',
        };
    }

    /**
     * Higher-quality preset for the Expert tier (may be slower / costlier).
     */
    public function expertModel(): string
    {
        return match ($this) {
            self::Xai => 'grok-4.5',
            self::OpenAi => 'gpt-5.6-terra',
            self::Anthropic => 'claude-sonnet-5',
        };
    }

    /**
     * Curated model tiers for Integrations (Default is null / package default).
     *
     * @return list<array{tier: 'auto'|'fast'|'expert', model: string|null, label: string}>
     */
    public function modelPresets(): array
    {
        return [
            [
                'tier' => 'auto',
                'model' => null,
                'label' => 'Default',
            ],
            [
                'tier' => 'fast',
                'model' => $this->defaultModel(),
                'label' => 'Fast',
            ],
            [
                'tier' => 'expert',
                'model' => $this->expertModel(),
                'label' => 'Expert',
            ],
        ];
    }

    public function consoleUrl(): string
    {
        return match ($this) {
            self::Xai => 'https://console.x.ai',
            self::OpenAi => 'https://platform.openai.com/api-keys',
            self::Anthropic => 'https://console.anthropic.com/settings/keys',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
