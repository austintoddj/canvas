<?php

namespace Canvas\Http\Controllers;

use Canvas\Canvas;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class UploadsController extends Controller
{
    /**
     * Store a newly created resource in storage.
     *
     * @return mixed
     */
    public function store()
    {
        $payload = request()->file();

        if (! $payload) {
            return response()->json(null, 400);
        }

        // Only grab the first element because single file uploads
        // are not supported at this time
        $file = reset($payload);

        // Use pathinfo to separate the filename and extension
        $path_parts = pathinfo($file->getClientOriginalName());
    
        $first_name = \Illuminate\Support\Str::kebab($path_parts['filename']);
    
        // Construct the new filename with time() before the extension
        $name = $first_name . '-' . time() . '.' . $path_parts['extension'];

        $path = $file->storeAs(Canvas::baseStoragePath(), $name, [
            'disk' => config('canvas.storage_disk'),
        ]);

        return Storage::disk(config('canvas.storage_disk'))->url($path);
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
