<?php

use Canvas\Analytics\MonthOverMonth;

it('computes percentage growth when both periods have traffic', function (): void {
    expect(MonthOverMonth::compare(6, 2))->toBe([
        'direction' => 'up',
        'percentage' => '200',
        'comparable' => true,
    ]);

    expect(MonthOverMonth::compare(1, 4))->toBe([
        'direction' => 'down',
        'percentage' => '75',
        'comparable' => true,
    ]);
});

it('does not invent percentage growth from a zero baseline', function (): void {
    expect(MonthOverMonth::compare(627, 0))->toBe([
        'direction' => 'up',
        'percentage' => '0',
        'comparable' => false,
    ]);

    expect(MonthOverMonth::compare(0, 0))->toBe([
        'direction' => 'down',
        'percentage' => '0',
        'comparable' => false,
    ]);
});
