<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\DestroyUploadRequest;
use Canvas\Http\Requests\UploadRequest;
use Canvas\Support\Paths;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class UploadsController extends Controller
{
    public function store(UploadRequest $request): JsonResponse
    {
        $disk = config('canvas.storage_disk');

        $path = $request->file('file')->store(Paths::baseStoragePath(), ['disk' => $disk]);

        return response()->json([
            'url' => Storage::disk($disk)->url($path),
            'path' => $path,
        ], 201);
    }

    public function destroy(DestroyUploadRequest $request): Response
    {
        Storage::disk(config('canvas.storage_disk'))->delete($request->validated('path'));

        return response()->noContent();
    }
}
