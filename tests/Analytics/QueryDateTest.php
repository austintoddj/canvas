<?php

use Canvas\Analytics\QueryDate;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;

it('builds sqlite day and hour expressions by default in tests', function (): void {
    expect(QueryDate::dayExpression('created_at'))->toBe("strftime('%Y-%m-%d', created_at)")
        ->and(QueryDate::hourExpression('created_at'))->toBe("strftime('%H:00', created_at)")
        ->and(QueryDate::dayExpression('views.created_at'))->toBe("strftime('%Y-%m-%d', views.created_at)");
});

it('builds pgsql day and hour expressions', function (): void {
    $connection = Mockery::mock(Connection::class);
    $connection->shouldReceive('getDriverName')->twice()->andReturn('pgsql');
    DB::shouldReceive('connection')->twice()->andReturn($connection);

    expect(QueryDate::dayExpression('created_at'))->toBe("to_char(created_at, 'YYYY-MM-DD')")
        ->and(QueryDate::hourExpression('created_at'))->toBe("to_char(created_at, 'HH24:00')");
});

it('builds mysql-compatible day and hour expressions for other drivers', function (): void {
    $connection = Mockery::mock(Connection::class);
    $connection->shouldReceive('getDriverName')->twice()->andReturn('mysql');
    DB::shouldReceive('connection')->twice()->andReturn($connection);

    expect(QueryDate::dayExpression('created_at'))->toBe('DATE(created_at)')
        ->and(QueryDate::hourExpression('created_at'))->toBe("DATE_FORMAT(created_at, '%H:00')");
});
