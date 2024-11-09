<?php

namespace Canvas\Http\Controllers;

use Canvas\Canvas;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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

        // Only grab the first element because single file uploads are not supported at this time
        $file = reset($payload);

        // Generate a unique identifier based on a hash of the original filename
        $path_parts = pathinfo($file->getClientOriginalName());
        $first_name = Str::kebab($path_parts['filename']);
        $unique_id = substr(md5($path_parts['filename']), 0, 8);
        $filename = $first_name . '-' . $unique_id . '.' . $path_parts['extension'];

        // Store the file using the generated filename
        $path = $file->storeAs(Canvas::baseStoragePath(), $filename, [
            'disk' => config('canvas.storage_disk'),
        ]);

        // Return the URL of the stored file
        return Storage::disk(config('canvas.storage_disk'))->url($path);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy()
    {
        // Validate that a filename is provided
        $filename = trim(request()->getContent());

        if (empty($filename)) {
            return response()->json(null, 400);
        }

        // Define the expected storage path
        $storagePath = Canvas::baseStoragePath();
        $path = "{$storagePath}/{$filename}";

        // Delete the file from storage
        Storage::disk(config('canvas.storage_disk'))->delete($path);

        // Return a 204 No Content response
        return response()->json([], 204);
    }
}
