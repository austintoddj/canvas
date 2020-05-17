<?php

namespace Canvas\Http\Controllers;

use Illuminate\Http\UploadedFile;
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

        if ($payload) {
            // Only single file uploads are supported at this time
            $file = reset($payload);

            if ($file instanceof UploadedFile) {
                $path = $file->storePublicly($this->getBaseStoragePath(), [
                    'disk' => config('canvas.storage_disk'),
                ]);

                return Storage::disk(config('canvas.storage_disk'))->url($path);
            }
        } else {
            return response()->json(null, 400);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy()
    {
        if (! empty(request()->getContent())) {
            $file = pathinfo(request()->getContent());

            $storagePath = $this->getBaseStoragePath();
            $path = "{$storagePath}/{$file['basename']}";

            Storage::disk(config('canvas.storage_disk'))->delete($path);

            return response()->json([], 204);
        } else {
            return response()->json(null, 400);
        }
    }

    /**
     * Return the storage path url.
     *
     * @return string
     */
    private function getBaseStoragePath(): string
    {
        return sprintf('%s/%s', config('canvas.storage_path'), 'images');
    }
}
