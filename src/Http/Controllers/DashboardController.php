<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Canvas;
use Canvas\Models\Post;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

final class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        ['lookup' => $lookup, 'lookback' => $lookback] = $this->dateRange(request('from'), request('to'));

        $builder = Post::query()
            ->select('id')
            ->published()
            ->latest()
            ->when(request('scope', 'user') === 'all', function (Builder $query) {
                return $query;
            }, function (Builder $query) {
                return $query->where('user_id', request()->user('canvas')->id);
            });

        $currentPosts = $builder->withCount(['views' => function (Builder $query) use ($lookup) {
            return $query->whereBetween('created_at', [
                $lookup['start'],
                $lookup['end'],
            ]);
        }])
        ->withCount(['visits' => function (Builder $query) use ($lookup) {
            return $query->whereBetween('created_at', [
                $lookup['start'],
                $lookup['end'],
            ]);
        }])->get();

        $historicalPosts = $builder->withCount(['views' => function (Builder $query) use ($lookback) {
            return $query->whereBetween('created_at', [
                $lookback['start'],
                $lookback['end'],
            ]);
        }])
                ->withCount(['visits' => function (Builder $query) use ($lookback) {
            return $query->whereBetween('created_at', [
                $lookback['start'],
                $lookback['end'],
            ]);
                }])->get();

        return response()->json([
            [
                'name' => 'Total pageviews',
                'count' => $currentPosts->sum('views_count'),
                'change' => bcsub((string) $currentPosts->sum('views_count'), (string) $historicalPosts->sum('views_count')),
            ],
            [
                'name' => 'Unique Visitors',
                'count' => $currentPosts->sum('visits_count'),
                'change' => bcsub((string) $currentPosts->sum('visits_count'), (string) $historicalPosts->sum('visits_count')),
            ],
        ]);
    }

    public function chart(): JsonResponse
    {
        $posts = Post::query()
                     ->select('id')
                     ->published()
                     ->latest()
                     ->when(request()->query('scope', 'user') === 'all', function (Builder $query) {
                         return $query;
                     }, function (Builder $query) {
                         return $query->where('user_id', request()->user('canvas')->id);
                     })
                     ->with(['views' => function (HasMany $views) {
                         return $views->whereBetween('created_at', [
                             today()->subDays(30)->startOfDay()->toDateTimeString(),
                             today()->endOfDay()->toDateTimeString(),
                         ]);
                     }])
                     ->with(['visits' => function (HasMany $visits) {
                         return $visits->whereBetween('created_at', [
                             today()->subDays(30)->startOfDay()->toDateTimeString(),
                             today()->endOfDay()->toDateTimeString(),
                         ]);
                     }])
                     ->get();

        return response()->json([
            'views' => Canvas::calculateTotalForDays($posts->pluck('views')->flatten())->toJson(),
            'visits' => Canvas::calculateTotalForDays($posts->pluck('visits')->flatten())->toJson(),
        ]);
    }

    // public function sources(): JsonResponse
    // {
    //     # code...
    // }

    // public function pages(): JsonResponse
    // {
    //     # code...
    // }

    // public function countries(): JsonResponse
    // {
    //     # code...
    // }

    // public function devices(): JsonResponse
    // {
    //     # code...
    // }

    /**
     * Undocumented function.
     *
     * @param string|null $from
     * @param string|null $to
     * @return array
     */
    protected function dateRange(?string $from, ?string $to): array
    {
        $primaryStart = $from ? Carbon::createFromDate($from)->startOfDay() : now()->subDays(30)->startOfDay();
        $primaryEnd = $to ? Carbon::createFromDate($to)->endOfDay() : now()->endOfDay();

        $days = $primaryStart->diffInDays($primaryEnd);

        $secondaryStart = $primaryStart->copy()->subDays($days)->startOfDay();
        $secondaryEnd = $primaryStart->copy()->startOfDay();

        return [
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
}
