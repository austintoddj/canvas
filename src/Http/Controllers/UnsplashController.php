<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Http;

class UnsplashController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $accessKey = config('canvas.unsplash.access_key');

        if (empty($accessKey)) {
            return response()->json(['error' => 'Unsplash access key not configured.'], 422);
        }

        $response = Http::withHeaders([
            'Authorization' => 'Client-ID '.$accessKey,
            'Accept-Version' => 'v1',
        ])->get('https://api.unsplash.com/search/photos', [
            'query' => request()->query('query', ''),
            'per_page' => 30,
        ]);

        return response()->json($response->json(), $response->status());
    }
}
