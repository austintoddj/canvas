<?php

namespace Canvas;

use Illuminate\Support\Facades\Storage;

class Downloader
{
    /**
     * Download a given file from storage.
     *
     * @param string $path
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function run(string $path)
    {
        $file = Storage::disk(config('canvas.storage_disk'))
            ->getDriver()
            ->getAdapter()
            ->applyPathPrefix($path);

        return response()->download($file);
    }
}
