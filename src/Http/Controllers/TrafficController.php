<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Canvas;
use Canvas\Http\Requests\TrafficLookupRequest;
use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Canvas\Services\StatisticsService;
use Carbon\Carbon;
use Carbon\CarbonInterval;
use DateInterval;
use DatePeriod;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Collection;

class TrafficController extends Controller
{
    public function views(TrafficLookupRequest $request): JsonResponse
    {
        $data = $request->validated();

        $service = new StatisticsService();

        // $data['date']
        // $data['from']
        // $data['to']

        return response()->json($service->getViewsForRange());
    }

    public function visits(): JsonResponse
    {
        // code...
    }

    public function chart(): JsonResponse
    {
        $postIds = Post::when(request()->query('scope', 'user') === 'all', function (Builder $query) {
            return $query;
        }, function (Builder $query) {
            return $query->where('user_id', request()->user('canvas')->id);
        })
                       ->published()
                       ->pluck('id')
                       ->toArray();

        $views = View::select('created_at')
                     ->whereBetween('created_at', [
                         $this->lookup['start'],
                         $this->lookup['end'],
                     ])
                     ->whereIn('post_id', $postIds)
                     ->get();

        $visits = Visit::select('created_at')
                       ->whereBetween('created_at', [
                           $this->lookup['start'],
                           $this->lookup['end'],
                       ])
                       ->whereIn('post_id', $postIds)
                       ->get();

        return response()->json([
            'views' => $this->datePlots($views)->toJson(),
            'visits' => $this->datePlots($visits)->toJson(),
        ]);
    }

    public function sources(): JsonResponse
    {
        // code...
    }

    public function pages(): JsonResponse
    {
        // code...
    }

    public function countries(): JsonResponse
    {
        // code...
    }

    public function devices(): JsonResponse
    {
        // code...
    }

    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $this->getRangeLookups();

        $postIds = Post::published()
                       ->when(request()->query('scope', 'user') === 'all', function (Builder $query) {
                           return $query;
                       }, function (Builder $query) {
                           return $query->where('user_id', request()->user('canvas')->id);
                       })
                       ->pluck('id')
                       ->toArray();

        $lookupViews = View::select('id')
                           ->whereBetween('created_at', [
                               $this->lookup['start'],
                               $this->lookup['end'],
                           ])
                           ->whereIn('post_id', $postIds)
                           ->count();

        $lookbackViews = View::select('id')
                             ->whereBetween('created_at', [
                                 $this->lookback['start'],
                                 $this->lookback['end'],
                             ])
                             ->whereIn('post_id', $postIds)
                             ->count();

        $lookupVisits = Visit::select('id')
                             ->whereBetween('created_at', [
                                 $this->lookup['start'],
                                 $this->lookup['end'],
                             ])
                             ->whereIn('post_id', $postIds)
                             ->count();

        $lookbackVisits = Visit::select('id')
                               ->whereBetween('created_at', [
                                   $this->lookback['start'],
                                   $this->lookback['end'],
                               ])
                               ->whereIn('post_id', $postIds)
                               ->count();

        return response()->json([
            [
                'name' => 'Total pageviews',
                'count' => $lookupViews,
                'change' => $this->percentOfChange($lookupViews, $lookbackViews),
            ],
            [
                'name' => 'Unique Visitors',
                'count' => $lookupVisits,
                'change' => $this->percentOfChange($lookupVisits, $lookbackVisits),
            ],
        ]);
    }

    /**
     * Display stats for the specified resource.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function stats(string $id): JsonResponse
    {
        // TODO: Move this to the dashboard view with query params

        $post = Post::when(request()->user('canvas')->isContributor, function (Builder $query) {
            return $query->where('user_id', request()->user('canvas')->id);
        }, function (Builder $query) {
            return $query;
        })
                    ->published()
                    ->findOrFail($id);

        $currentViews = $post->views->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $currentVisits = $post->visits->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $previousViews = $post->views->whereBetween('created_at', [
            today()->subMonth()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonth()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $previousVisits = $post->visits->whereBetween('created_at', [
            today()->subMonth()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonth()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        return response()->json([
            'post' => $post,
            'readTime' => Canvas::calculateReadTime($post->body),
            'popularReadingTimes' => Canvas::calculatePopularReadingTimes($post),
            'topReferers' => Canvas::calculateTopReferers($post),
            'monthlyViews' => $currentViews->count(),
            'totalViews' => $post->views->count(),
            'monthlyVisits' => $currentVisits->count(),
            'monthOverMonthViews' => Canvas::compareMonthOverMonth($currentViews, $previousViews),
            'monthOverMonthVisits' => Canvas::compareMonthOverMonth($currentVisits, $previousVisits),
            'graph' => [
                'views' => Canvas::calculateTotalForDays($currentViews)->toJson(),
                'visits' => Canvas::calculateTotalForDays($currentVisits)->toJson(),
            ],
        ]);
    }

    protected function rangeLookups($from, $to): array
    {
        $primaryStart = Carbon::parse($from) ?? now()->subDays(30);
        $primaryEnd = Carbon::parse($to)->greaterThan($primaryStart) ? Carbon::parse($to) : now();

        return [
            'period' => $days,
            'lookup' => [
                'start' => $primaryStart->toDateTimeString(),
                'end' => $primaryEnd->toDateTimeString(),
            ],
            'lookback' => [
                'start' => $secondaryStart->toDateTimeString(),
                'end' => $secondaryEnd->toDateTimeString(),
            ],
        ];
    }

    protected function datePlots(Collection $data): Collection
    {
        // Filter the data to only include created_at date strings
        $filtered = new Collection();

        $data->sortBy('created_at')->each(function ($item) use ($filtered) {
            $filtered->push($item->created_at->toDateString());
        });

        // Count the unique values and assign to their respective keys
        $unique = array_count_values($filtered->toArray());

        // Create a day range to hold the default date values

        // this works for day breakdowns
        $period = $this->generateDateRange(
            Carbon::create($this->lookback['start']),
            CarbonInterval::days(),
            $this->period,
            DatePeriod::EXCLUDE_START_DATE,
            'Y-m-d'
        );

        // this works for hourly breakdowns
        // $period = $this->generateDateRange(
        //     Carbon::create($this->lookup['start']),
        //     CarbonInterval::hours(),
        //     24,
        //     DatePeriod::EXCLUDE_START_DATE,
        //     'g:i A'
        // );

        dd($period);

        // Compare the data and date range arrays, assigning counts where applicable
        $results = new Collection();

        foreach ($period as $date) {
            if (array_key_exists($date, $unique)) {
                $results->put($date, $unique[$date]);
            } else {
                $results->put($date, 0);
            }
        }

        return $results;
    }

    /**
     * Return the percentage of change between two given numbers.
     */
    protected function percentOfChange($numberOne, $numberTwo)
    {
        $difference = (int) $numberOne - (int) $numberTwo;

        $change = $numberOne != 0 ? ($difference / $numberTwo) * 100 : $numberOne * 100;

        return round($change, 1);
    }

    /**
     * Return an array of formatted date/time strings.
     *
     * @param DateTimeInterface $start_date
     * @param DateInterval $interval
     * @param int $recurrences
     * @param int $exclusive
     * @param string $format
     * @return array
     */
    protected function generateDateRange(
        DateTimeInterface $start_date,
        DateInterval $interval,
        int $recurrences,
        int $exclusive = 1,
        string $format = 'Y-m-d'
    ): array {
        $period = new DatePeriod($start_date, $interval, $recurrences, $exclusive);
        $dates = new Collection();

        foreach ($period as $date) {
            $dates->push($date->format($format));
        }

        return $dates->toArray();
    }
}
