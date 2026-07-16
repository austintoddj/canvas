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
     * Fast, non-reasoning defaults for editor rewrite/SEO latency.
     * Prefer mini/haiku/fast-non-reasoning SKUs over flagship thinking models.
     */
    public function defaultModel(): string
    {
        return match ($this) {
            self::Xai => 'grok-4-fast-non-reasoning',
            self::OpenAi => 'gpt-4o-mini',
            self::Anthropic => 'claude-haiku-4-5',
        };
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
