<?php

namespace Canvas\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    /**
     * Process an image upload.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function __invoke()
    {
        $maxUploadInBytes = config('canvas.max_upload');

        if (request()->image->getSize() <= $maxUploadInBytes) {
            $path = request()->image->store(sprintf('%s/%s', config('canvas.storage_path'), 'images'), [
                'disk'       => config('canvas.storage_disk'),
                'visibility' => 'public',
            ]);

            return response()->json(Storage::disk(config('canvas.storage_disk'))->url($path), 200);
        } else {
            $errorMessage = sprintf('%s %s', __('canvas::posts.forms.editor.images.errors.size'), $this->formatBytes($maxUploadInBytes));

            return response()->json($errorMessage, 422);
        }
    }

    /**
     * Format bytes into a human-readable string.
     *
     * @param $bytes
     * @param int $precision
     * @return string
     * @link https://stackoverflow.com/a/2510540
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $base = log($bytes, 1024);
        $suffixes = ['', 'KB', 'MB', 'GB', 'TB'];

        return round(pow(1024, $base - floor($base)), $precision).' '.$suffixes[floor($base)];
    }
}
