<?php

namespace Canvas\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Carbon\CarbonInterval;
use DateInterval;
use DatePeriod;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Collection;

class StatsController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $posts = Post::query()
                     ->when(request()->query('scope', 'user') === 'all', function (Builder $query) {
                         return $query;
                     }, function (Builder $query) {
                         return $query->where('user_id', request()->user('canvas')->id);
                     })
                     ->published()
                     ->latest()
                     ->get();

        $views = View::select('created_at')
                     ->whereIn('post_id', $posts->pluck('id'))
                     ->whereBetween('created_at', [
                         today()->subDays(30)->startOfDay()->toDateTimeString(),
                         today()->endOfDay()->toDateTimeString(),
                     ])->get();

        $visits = Visit::select('created_at')
                       ->whereIn('post_id', $posts->pluck('id'))
                       ->whereBetween('created_at', [
                           today()->subDays(30)->startOfDay()->toDateTimeString(),
                           today()->endOfDay()->toDateTimeString(),
                       ])->get();

        return response()->json([
            'totalViews' => $views->count(),
            'totalVisits' => $visits->count(),
            'traffic' => [
                'views' => self::calculateTotalForDays($views, 30)->toJson(),
                'visits' => self::calculateTotalForDays($visits, 30)->toJson(),
            ],
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        $post = Post::query()
                    ->when(request()->user('canvas')->isContributor, function (Builder $query) {
                        return $query->where('user_id', request()->user('canvas')->id);
                    }, function (Builder $query) {
                        return $query;
                    })
                    ->find($id);

        if (! $post || ! $post->published) {
            return response()->json(null, 404);
        }

        $previousMonthlyViews = $post->views->whereBetween('created_at', [
            today()->subMonth()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonth()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $currentMonthlyViews = $post->views->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $lastThirtyDays = $post->views->whereBetween('created_at', [
            today()->subDays(30)->startOfDay()->toDateTimeString(),
            today()->endOfDay()->toDateTimeString(),
        ]);

        $previousMonthlyVisits = $post->visits->whereBetween('created_at', [
            today()->subMonth()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonth()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $currentMonthlyVisits = $post->visits->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        return response()->json([
            'post' => $post,
            'readTime' => $post->read_time,
            'popularReadingTimes' => $post->popular_reading_times,
            'topReferers' => $post->top_referers,
            'monthlyViews' => $currentMonthlyViews->count(),
            'totalViews' => $post->views->count(),
            'monthlyVisits' => $currentMonthlyVisits->count(),
            'monthOverMonthViews' => $this->compareMonthOverMonth($currentMonthlyViews, $previousMonthlyViews),
            'monthOverMonthVisits' => $this->compareMonthOverMonth($currentMonthlyVisits, $previousMonthlyVisits),
            'traffic' => [
                'views' => $this->calculateTotalForDays($lastThirtyDays, 30)->toJson(),
                'visits' => $this->calculateTotalForDays($post->visits, 30)->toJson(),
            ],
        ]);
    }

    /**
     * Given a collection of Views or Visits, return an array of formatted
     * date strings and their related counts for a given number of days.
     *
     * example: [ Y-m-d => total ]
     *
     * @param Collection $data
     * @param int $days
     * @return Collection
     */
    protected function calculateTotalForDays(Collection $data, int $days = 30): Collection
    {
        // Filter the data to only include created_at date strings
        $filtered = collect();
        $data->sortBy('created_at')->each(function ($item) use ($filtered) {
            $filtered->push($item->created_at->toDateString());
        });

        // Count the unique values and assign to their respective keys
        $unique = array_count_values($filtered->toArray());

        // Create a day range to hold the default date values
        $period = $this->generateRange(today()->subDays($days), CarbonInterval::day(), $days);

        // Compare the data and date range arrays, assigning counts where applicable
        $total = collect();

        foreach ($period as $date) {
            if (array_key_exists($date, $unique)) {
                $total->put($date, $unique[$date]);
            } else {
                $total->put($date, 0);
            }
        }

        return $total;
    }

    /**
     * Given two collections of monthly data, compare the totals and return the
     * overall directional trend as well as the percentage increase/decrease.
     *
     * @param Collection $current
     * @param Collection $previous
     * @return array
     */
    protected function compareMonthOverMonth(Collection $current, Collection $previous): array
    {
        $dataCountThisMonth = $current->count();
        $dataCountLastMonth = $previous->count();

        if ($dataCountLastMonth != 0) {
            $difference = (int) $dataCountThisMonth - (int) $dataCountLastMonth;
            $growth = ($difference / $dataCountLastMonth) * 100;
        } else {
            $growth = $dataCountThisMonth * 100;
        }

        return [
            'direction' => $dataCountThisMonth > $dataCountLastMonth ? 'up' : 'down',
            'percentage' => number_format(abs($growth)),
        ];
    }

    /**
     * Generate a date range array of formatted strings.
     *
     * @param DateTimeInterface $start_date
     * @param DateInterval $interval
     * @param int $recurrences
     * @param int $exclusive
     * @return array
     */
    protected function generateRange(DateTimeInterface $start_date, DateInterval $interval, int $recurrences, int $exclusive = 1): array
    {
        $period = new DatePeriod($start_date, $interval, $recurrences, $exclusive);
        $dates = collect();

        foreach ($period as $date) {
            $dates->push($date->format('Y-m-d'));
        }

        return $dates->toArray();
    }
}
