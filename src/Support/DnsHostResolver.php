<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Contracts\HostResolver;
use Throwable;

/**
 * DNS lookup for webhook target checks.
 *
 * Uses dns_get_record() so both A and AAAA answers are visible. When that
 * lookup fails, falls back to gethostbynamel() for A records only.
 */
class DnsHostResolver implements HostResolver
{
    /**
     * @return list<string>
     */
    public function resolve(string $host): array
    {
        $records = $this->dnsRecords($host);

        if ($records === false) {
            return $this->ipv4Addresses($host);
        }

        return $this->addressesFromRecords($records);
    }

    /**
     * Protected so tests can substitute lookup results.
     *
     * @return array<int, mixed>|false
     */
    protected function dnsRecords(string $host): array|false
    {
        if (! function_exists('dns_get_record') || ! defined('DNS_A') || ! defined('DNS_AAAA')) {
            return false;
        }

        set_error_handler(static fn (mixed ...$arguments): bool => true);

        try {
            $records = dns_get_record($host, DNS_A | DNS_AAAA);
        } catch (Throwable) {
            return false;
        } finally {
            restore_error_handler();
        }

        return is_array($records) ? $records : false;
    }

    /**
     * @return list<string>
     */
    private function ipv4Addresses(string $host): array
    {
        try {
            $ips = gethostbynamel($host);
        } catch (Throwable) {
            return [];
        }

        if ($ips === false || $ips === []) {
            return [];
        }

        return $ips;
    }

    /**
     * @param  array<int, mixed>  $records
     * @return list<string>
     */
    private function addressesFromRecords(array $records): array
    {
        $ips = [];

        foreach ($records as $record) {
            if (! is_array($record)) {
                continue;
            }

            foreach (['ip', 'ipv6'] as $key) {
                $value = $record[$key] ?? null;

                if (is_string($value) && $value !== '') {
                    $ips[] = $value;
                }
            }
        }

        return array_values(array_unique($ips));
    }
}
