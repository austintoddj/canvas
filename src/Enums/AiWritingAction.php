<?php

declare(strict_types=1);

namespace Canvas\Enums;

enum AiWritingAction: string
{
    case Improve = 'improve';
    case FixGrammar = 'fix_grammar';
    case Shorten = 'shorten';
    case Expand = 'expand';
    case Custom = 'custom';

    public function instruction(): string
    {
        return match ($this) {
            self::Improve => 'Improve the writing quality: clarity, flow, and word choice. Keep the same meaning, tone, and approximate length.',
            self::FixGrammar => 'Fix grammar, spelling, and punctuation only. Do not change style or meaning.',
            self::Shorten => 'Make the text more concise while preserving the key points and voice.',
            self::Expand => 'Expand the text slightly with useful detail or smoother transitions. Stay on topic and keep the voice.',
            self::Custom => 'Follow the user instruction carefully while preserving the author\'s voice when possible.',
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
