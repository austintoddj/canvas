<?php

declare(strict_types=1);

namespace Canvas\Support;

final class WebhookSigner
{
    public static function sign(string $secret, string $rawBody, int $timestamp): string
    {
        $digest = hash_hmac('sha256', self::signedPayload($timestamp, $rawBody), $secret);

        return "t={$timestamp},v1={$digest}";
    }

    /**
     * Verify a Canvas-Signature header (constant-time compare on v1 digest).
     */
    public static function verify(
        string $secret,
        string $rawBody,
        string $header,
        int $toleranceSeconds = 300,
        ?int $now = null,
    ): bool {
        $parts = self::parseHeader($header);

        if ($parts === null) {
            return false;
        }

        ['t' => $timestamp, 'v1' => $digest] = $parts;

        $now ??= time();

        if (abs($now - $timestamp) > $toleranceSeconds) {
            return false;
        }

        $expected = hash_hmac('sha256', self::signedPayload($timestamp, $rawBody), $secret);

        return hash_equals($expected, $digest);
    }

    private static function signedPayload(int $timestamp, string $rawBody): string
    {
        return $timestamp.'.'.$rawBody;
    }

    /**
     * @return array{t: int, v1: string}|null
     */
    private static function parseHeader(string $header): ?array
    {
        $timestamp = null;
        $digest = null;

        foreach (explode(',', $header) as $segment) {
            $segment = trim($segment);
            $pair = explode('=', $segment, 2);

            if (count($pair) !== 2) {
                continue;
            }

            [$key, $value] = $pair;

            if ($key === 't' && ctype_digit($value)) {
                $timestamp = (int) $value;
            }

            if ($key === 'v1' && $value !== '') {
                $digest = $value;
            }
        }

        if ($timestamp === null || $digest === null) {
            return null;
        }

        return ['t' => $timestamp, 'v1' => $digest];
    }
}
