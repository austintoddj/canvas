<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Support\Unsplash;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Http;

class UnsplashController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $accessKey = Unsplash::accessKey();

        if (empty($accessKey)) {
            return response()->json(['error' => 'Unsplash access key not configured.'], 422);
        }

        $query = trim((string) request()->query('query', ''));

        if ($query === '') {
            return response()->json(['error' => 'A search query is required.'], 422);
        }

        $page = max(1, (int) request()->query('page', 1));

        $response = Http::withHeaders([
            'Authorization' => 'Client-ID '.$accessKey,
            'Accept-Version' => 'v1',
        ])->get('https://api.unsplash.com/search/photos', [
            'query' => $query,
            'page' => $page,
            'per_page' => 30,
        ]);

        return response()->json($response->json(), $response->status());
    }
}
