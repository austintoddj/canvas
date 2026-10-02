<?php

declare(strict_types=1);

namespace Canvas\Contracts;

interface HostResolver
{
    /**
     * A and AAAA addresses for a hostname. Empty when lookup yields nothing.
     *
     * @return list<string>
     */
    public function resolve(string $host): array;
}
