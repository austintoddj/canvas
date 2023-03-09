<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Canvas;
use Canvas\Http\Requests\StoreImageRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class ImageController extends Controller
{
    /**
     * Store a newly created resource in storage.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreImageRequest $request)
    {
        $path = $request->file('image')->storePublicly(Canvas::baseStoragePathForImages(), [
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

        $path = vsprintf('%s/%s', [
            Canvas::baseStoragePathForImages(),
            $file['basename'],
        ]);

        Storage::disk(config('canvas.storage_disk'))->delete($path);

        return response()->json([], 204);
    }
}
