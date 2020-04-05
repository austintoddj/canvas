<?php

namespace Canvas\Tests\Unit;

use Canvas\Post;
use Canvas\Tracker;
use Canvas\View;
use Canvas\Visit;
use Canvas\Tests\TestCase;
use Carbon\CarbonInterval;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TrackerTest extends TestCase
{
    use RefreshDatabase, Tracker;

    /** @test */
    public function get_tracked_data_for_array_of_post_ids()
    {
        $days = 7;

        $post_1 = factory(Post::class)->create();
        $post_1->views()->createMany(
            factory(View::class, 5)->make()->toArray()
        );
        $post_1->visits()->createMany(
            factory(Visit::class, 4)->make()->toArray()
        );

        $post_2 = factory(Post::class)->create();
        $post_2->views()->createMany(
            factory(View::class, 3)->make()->toArray()
        );
        $post_2->visits()->createMany(
            factory(Visit::class, 2)->make()->toArray()
        );

        $data = $this->getTrackedData([$post_1->id, $post_2->id], $days);

        $this->assertEquals($data['startDate'], now()->subDays($days)->format('M j'));
        $this->assertEquals($data['endDate'], now()->format('M j'));

        $this->assertArrayHasKey('posts', $data);
        $this->assertArrayHasKey($post_1->id, $data['posts']);
        $this->assertArrayHasKey($post_2->id, $data['posts']);
        $this->assertArrayHasKey('totals', $data);

        $this->assertEquals(5, $data['posts'][$post_1->id]['views']);
        $this->assertEquals(4, $data['posts'][$post_1->id]['visits']);

        $this->assertEquals(3, $data['posts'][$post_2->id]['views']);
        $this->assertEquals(2, $data['posts'][$post_2->id]['visits']);

        $this->assertEquals($data['totals']['views'], array_sum([$post_1->views()->count(), $post_2->views()->count()]));
        $this->assertEquals($data['totals']['visits'], array_sum([$post_1->visits()->count(), $post_2->visits()->count()]));
    }

    /** @test */
    public function get_daily_visit_counts_for_a_given_collection()
    {
        $days = 30;
        $visits_today = 10;

        $visits = factory(Visit::class, $visits_today)->create();

        $data = $this->countTrackedData($visits, $days);

        $this->assertCount($days, $data);
        $this->assertArrayHasKey(today()->toDateString(), $data);
        $this->assertArrayHasKey(today()->subDays($days - 1)->toDateString(), $data);
        $this->assertEquals($visits_today, $data[today()->toDateString()]);
    }

    /** @test */
    public function get_daily_view_counts_for_a_given_collection()
    {
        $days = 30;
        $views_today = 10;

        $views = factory(View::class, $views_today)->create();

        $data = $this->countTrackedData($views, $days);

        $this->assertCount($days, $data);
        $this->assertArrayHasKey(today()->toDateString(), $data);
        $this->assertArrayHasKey(today()->subDays($days - 1)->toDateString(), $data);
        $this->assertEquals($views_today, $data[today()->toDateString()]);
    }

    /** @test */
    public function evaluates_month_to_month_increased_visitor_performance()
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

        $data = $this->compareMonthToMonth($currentMonthlyVisits, $previousMonthlyVisits);

        $this->assertArrayHasKey('direction', $data);
        $this->assertEquals($data['direction'], 'up');

        $this->assertArrayHasKey('percentage', $data);
        $this->assertEquals($data['percentage'], '100');
    }

    /** @test */
    public function evaluates_month_to_month_decreased_visitor_performance()
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

        $data = $this->compareMonthToMonth($currentMonthlyVisits, $previousMonthlyVisits);

        $this->assertArrayHasKey('direction', $data);
        $this->assertEquals($data['direction'], 'down');

        $this->assertArrayHasKey('percentage', $data);
        $this->assertEquals($data['percentage'], '50');
    }

    /** @test */
    public function evaluates_month_to_month_increased_view_performance()
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

        $data = $this->compareMonthToMonth($currentMonthlyViews, $previousMonthlyViews);

        $this->assertArrayHasKey('direction', $data);
        $this->assertEquals($data['direction'], 'up');

        $this->assertArrayHasKey('percentage', $data);
        $this->assertEquals($data['percentage'], '100');
    }

    /** @test */
    public function evaluates_month_to_month_decreased_view_performance()
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

        $data = $this->compareMonthToMonth($currentMonthlyViews, $previousMonthlyViews);

        $this->assertArrayHasKey('direction', $data);
        $this->assertEquals($data['direction'], 'down');

        $this->assertArrayHasKey('percentage', $data);
        $this->assertEquals($data['percentage'], '50');
    }

    /** @test */
    public function generates_date_range_of_a_given_length()
    {
        $days = 30;
        $startDate = today()->subDays($days);

        $period = $this->generateDateRange($startDate, CarbonInterval::day(), $days);

        $this->assertCount($days, $period);
        $this->assertContains(today()->format('Y-m-d'), $period);
    }
}
