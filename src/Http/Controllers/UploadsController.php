<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Canvas;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class UploadsController extends Controller
{
    /**
     * Store a newly created resource in storage.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function store()
    {
        $payload = request()->file();

        if (! $payload) {
            return response()->json(null, 400);
        }

        // Only grab the first element because single file uploads
        // are not supported at this time
        // TODO: What does that comment even mean?
        $file = reset($payload);

        $path = $file->storePublicly(Canvas::baseStoragePath(), [
            'disk' => config('canvas.storage_disk'),
        ]);

        return response()->json(Storage::disk(config('canvas.storage_disk'))->url($path));
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy()
    {
        if (empty(request()->getContent())) {
            return response()->json(null, 400);
        }

        $file = pathinfo(request()->getContent());

        $storagePath = Canvas::baseStoragePath();

        $path = "{$storagePath}/{$file['basename']}";

        Storage::disk(config('canvas.storage_disk'))->delete($path);

        return response()->json([], 204);
    }
}
