<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Canvas;
use Canvas\Http\Requests\StoreUploadRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class ImageController extends Controller
{
    /**
     * Store a newly created resource in storage.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreUploadRequest $request)
    {
        $payload = request()->file();

        if (! $payload) {
            return response()->json(null, 400);
        }

        // Only grab the first element because single file uploads
        // are not supported at this time
        // TODO: What does that comment even mean?
        $file = reset($payload);

        $path = $file->storePublicly(Canvas::baseStoragePathForImages(), [
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
        dd(request()->getContent());
        if (empty(request()->getContent())) {
            return response()->json(null, 400);
        }
        //dd(request()->getContent());
        $file = pathinfo(request()->getContent());
        dd($file);
        //dd('here');
        $storagePath = Canvas::baseStoragePathForImages();

        $path = "{$storagePath}/{$file['basename']}";

        Storage::disk(config('canvas.storage_disk'))->delete($path);

        return response()->json([], 204);
    }
}
