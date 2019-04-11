<?php

namespace Canvas\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    /**
     * Process an image upload.
     *
     * @return string
     */
    public function store(): string
    {
        $diskName = config('canvas.storage_disk');
        $path = request()->image->store(sprintf('%s/%s', config('canvas.storage_path'), 'images'), [
            'disk'       => $diskName,
            'visibility' => 'public',
        ]);

        /* @noinspection PhpUndefinedMethodInspection */
        return Storage::disk($diskName)->url($path);
    }
}
