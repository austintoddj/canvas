<?php

declare(strict_types=1);

namespace Canvas\Support;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

final readonly class MediaStorage
{
    public function __construct(
        private Filesystem $disk,
        private string $diskName,
    ) {}

    public static function make(): self
    {
        $diskName = (string) config('canvas.storage_disk');

        return new self(Storage::disk($diskName), $diskName);
    }

    /**
     * @return array{
     *     path: string,
     *     filename: string,
     *     original_name: string,
     *     mime_type: string,
     *     size: int,
     *     width: ?int,
     *     height: ?int,
     *     url: string,
     * }
     */
    public function store(UploadedFile $file): array
    {
        $path = $file->store(Paths::baseStoragePath(), ['disk' => $this->diskName]);
        $metadata = $this->extractMetadata($file);

        return [
            'path' => $path,
            'filename' => basename($path),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $metadata['mime_type'],
            'size' => $metadata['size'],
            'width' => $metadata['width'],
            'height' => $metadata['height'],
            'url' => $this->url($path),
        ];
    }

    public function delete(string $path): void
    {
        $this->disk->delete($path);
    }

    public function url(string $path): string
    {
        return $this->disk->url($path);
    }

    public function isValidPath(string $path): bool
    {
        return str_starts_with($path, Paths::baseStoragePath());
    }

    /**
     * @return array{mime_type: string, size: int, width: ?int, height: ?int}
     */
    private function extractMetadata(UploadedFile $file): array
    {
        $dimensions = @getimagesize($file->getRealPath() ?: $file->getPathname());

        return [
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size' => (int) $file->getSize(),
            'width' => is_array($dimensions) ? ($dimensions[0] ?: null) : null,
            'height' => is_array($dimensions) ? ($dimensions[1] ?: null) : null,
        ];
    }
}
