<?php

declare(strict_types=1);

namespace Canvas\Support;

final class BotDetector
{
    /**
     * Common crawler and bot user-agent substrings.
     *
     * @var array<int, string>
     */
    private const PATTERNS = [
        'bot',
        'crawl',
        'spider',
        'slurp',
        'mediapartners',
        'facebookexternalhit',
        'twitterbot',
        'linkedinbot',
        'whatsapp',
        'telegrambot',
        'applebot',
        'bingpreview',
        'googleimageproxy',
        'ia_archiver',
        'python-requests',
        'curl/',
        'wget/',
        'libwww-perl',
        'go-http-client',
        'okhttp',
        'java/',
        'ruby',
        'node-fetch',
        'axios/',
        'postmanruntime',
        'insomnia',
        'httpie',
    ];

    public static function isBot(?string $agent): bool
    {
        if ($agent === null || $agent === '') {
            return true;
        }

        $lower = strtolower($agent);

        foreach (self::PATTERNS as $pattern) {
            if (str_contains($lower, $pattern)) {
                return true;
            }
        }

        return false;
    }
}
