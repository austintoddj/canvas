<?php

declare(strict_types=1);

namespace Canvas\Analytics;

use Illuminate\Support\Facades\DB;

final class QueryDate
{
    public static function dayExpression(string $column = 'created_at'): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "strftime('%Y-%m-%d', {$column})",
            'pgsql' => "to_char({$column}, 'YYYY-MM-DD')",
            default => "DATE({$column})",
        };
    }

    public static function hourExpression(string $column = 'created_at'): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "strftime('%H:00', {$column})",
            'pgsql' => "to_char({$column}, 'HH24:00')",
            default => "DATE_FORMAT({$column}, '%H:00')",
        };
    }
}
