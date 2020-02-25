<?php

namespace Canvas\Http\Controllers;

use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    /**
     * Stores a given file and returns the path.
     *
     * @return mixed
     */
    public function store()
    {
        $payload = request()->file();

        // We only expect single file uploads at this time
        $file = reset($payload);

        if ($file instanceof UploadedFile) {
            $path = $file->storePublicly($this->baseStoragePath(), [
                'disk' => config('canvas.storage_disk'),
            ]);

            return Storage::disk(config('canvas.storage_disk'))->url($path);
        }
    }

    /**
     * Deletes a given file from storage.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy()
    {
        $file = pathinfo(request()->getContent());
        $storagePath = $this->baseStoragePath();
        $path = "{$storagePath}/{$file['basename']}";

        $fileDeleted = Storage::disk(config('canvas.storage_disk'))->delete($path);

        if ($fileDeleted) {
            return response()->json([], 204);
        }
    }

    /**
     * Return the storage path url.
     *
     * @return string
     */
    private function baseStoragePath(): string
    {
        return sprintf('%s/%s', config('canvas.storage_path'), 'images');
    }
}
