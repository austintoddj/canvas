<?php

declare(strict_types=1);

namespace Canvas\Tests\Support;

use Canvas\Contracts\HostResolver;

/**
 * Offline stand-in so webhook checks do not query DNS.
 *
 * A sequence, when given, is returned call by call. Later calls reuse the
 * last list so a test can observe a second lookup without live DNS.
 */
final class FakeHostResolver implements HostResolver
{
    public int $calls = 0;

    /**
     * @param  list<list<string>>|null  $sequence
     */
    public function __construct(private ?array $sequence = null) {}

    /**
     * @return list<string>
     */
    public function resolve(string $host): array
    {
        $this->calls++;

        if ($this->sequence !== null && $this->sequence !== []) {
            $index = $this->calls - 1;

            if (! array_key_exists($index, $this->sequence)) {
                $index = (int) array_key_last($this->sequence);
            }

            return $this->sequence[$index];
        }

        $normalized = strtolower($host);

        if ($normalized === 'localhost' || str_ends_with($normalized, '.localhost')) {
            return ['127.0.0.1'];
        }

        if (str_ends_with($normalized, '.invalid')) {
            return [];
        }

        return ['8.8.8.8'];
    }
}
