<?php

namespace Canvas\Tests\Helpers;

use Canvas\Helpers\Traffic;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Canvas\Tests\TestCase;

/**
 * Class TrafficTest.
 *
 * @covers \Canvas\Helpers\Traffic
 */
class TrafficTest extends TestCase
{
    /** @test */
    public function it_can_calculate_total_visits()
    {
        $days = 30;
        $visitsToday = 10;

        $visits = factory(Visit::class, $visitsToday)->create();

        $data = Traffic::calculateTotalForDays($visits, $days);

        $this->assertCount($days, $data);
        $this->assertArrayHasKey(today()->toDateString(), $data);
        $this->assertArrayHasKey(today()->subDays($days - 1)->toDateString(), $data);
        $this->assertEquals($visitsToday, $data[today()->toDateString()]);
    }

    /** @test */
    public function it_can_calculate_total_views()
    {
        $days = 30;
        $viewsToday = 10;

        $views = factory(View::class, $viewsToday)->create();

        $data = Traffic::calculateTotalForDays($views, $days);

        $this->assertCount($days, $data);
        $this->assertArrayHasKey(today()->toDateString(), $data);
        $this->assertArrayHasKey(today()->subDays($days - 1)->toDateString(), $data);
        $this->assertEquals($viewsToday, $data[today()->toDateString()]);
    }

    /** @test */
    public function it_can_calculate_month_over_month_increased_visitor_performance()
    {
        factory(Visit::class, 1)->create([
            'created_at' => today()->subMonthWithoutOverflow()->toDateString(),
        ]);

        factory(Visit::class, 2)->create([
            'created_at' => today()->toDateString(),
        ]);

        $visits = Visit::all();
        $previousMonthlyVisits = $visits->whereBetween('created_at', [
            today()->subMonthWithoutOverflow()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonthWithoutOverflow()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);
        $currentMonthlyVisits = $visits->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $data = Traffic::compareMonthOverMonth($currentMonthlyVisits, $previousMonthlyVisits);

        $this->assertArrayHasKey('direction', $data);
        $this->assertSame($data['direction'], 'up');

        $this->assertArrayHasKey('percentage', $data);
        $this->assertSame($data['percentage'], '100');
    }

    /** @test */
    public function it_can_calculate_month_over_month_decreased_visitor_performance()
    {
        factory(Visit::class, 2)->create([
            'created_at' => today()->subMonthWithoutOverflow()->toDateString(),
        ]);

        factory(Visit::class, 1)->create([
            'created_at' => today()->toDateString(),
        ]);

        $visits = Visit::all();
        $previousMonthlyVisits = $visits->whereBetween('created_at', [
            today()->subMonthWithoutOverflow()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonthWithoutOverflow()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);
        $currentMonthlyVisits = $visits->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $data = Traffic::compareMonthOverMonth($currentMonthlyVisits, $previousMonthlyVisits);

        $this->assertArrayHasKey('direction', $data);
        $this->assertSame($data['direction'], 'down');

        $this->assertArrayHasKey('percentage', $data);
        $this->assertSame($data['percentage'], '50');
    }

    /** @test */
    public function it_can_calculate_month_over_month_increased_view_performance()
    {
        factory(View::class, 1)->create([
            'created_at' => today()->subMonthWithoutOverflow()->toDateString(),
        ]);

        factory(View::class, 2)->create([
            'created_at' => today()->toDateString(),
        ]);

        $views = View::all();
        $previousMonthlyViews = $views->whereBetween('created_at', [
            today()->subMonthWithoutOverflow()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonthWithoutOverflow()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);
        $currentMonthlyViews = $views->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $data = Traffic::compareMonthOverMonth($currentMonthlyViews, $previousMonthlyViews);

        $this->assertArrayHasKey('direction', $data);
        $this->assertSame($data['direction'], 'up');

        $this->assertArrayHasKey('percentage', $data);
        $this->assertSame($data['percentage'], '100');
    }

    /** @test */
    public function it_can_calculate_month_over_month_decreased_view_performance()
    {
        factory(View::class, 2)->create([
            'created_at' => today()->subMonthWithoutOverflow()->toDateString(),
        ]);

        factory(View::class, 1)->create([
            'created_at' => today()->toDateString(),
        ]);

        $views = View::all();
        $previousMonthlyViews = $views->whereBetween('created_at', [
            today()->subMonthWithoutOverflow()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonthWithoutOverflow()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);
        $currentMonthlyViews = $views->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $data = Traffic::compareMonthOverMonth($currentMonthlyViews, $previousMonthlyViews);

        $this->assertArrayHasKey('direction', $data);
        $this->assertSame($data['direction'], 'down');

        $this->assertArrayHasKey('percentage', $data);
        $this->assertSame($data['percentage'], '50');
    }
}
