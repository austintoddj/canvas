<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Models\Media;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Throwable;

final readonly class MediaService
{
    public function __construct(
        private MediaStorage $mediaStorage,
    ) {}

    /**
     * @param  array{alt?: ?string, caption?: ?string, original_name?: ?string}  $metadata
     *
     * @throws Throwable
     */
    public function storeMediaUpload(
        UploadedFile $file,
        object $user,
        string $id,
        array $metadata = [],
    ): Media {
        $existing = Media::query()->find($id);

        if ($existing !== null && Gate::forUser($user)->denies('update', $existing)) {
            throw (new ModelNotFoundException)->setModel(Media::class, [$existing->getKey()]);
        }

        $stored = $this->mediaStorage->store($file);
        $previousPath = $existing?->path;

        try {
            $media = $existing ?? new Media(['id' => $id]);

            $media->fill([
                'path' => $stored['path'],
                'filename' => $stored['filename'],
                'original_name' => $metadata['original_name'] ?? $stored['original_name'],
                'mime_type' => $stored['mime_type'],
                'size' => $stored['size'],
                'width' => $stored['width'],
                'height' => $stored['height'],
                'alt' => $metadata['alt'] ?? null,
                'caption' => $metadata['caption'] ?? null,
            ]);

            $media->user_id = $media->user_id ?? $user->id;
            $media->save();

            if ($previousPath !== null && $previousPath !== $stored['path']) {
                $this->mediaStorage->delete($previousPath);
            }

            return $media->refresh();
        } catch (Throwable $exception) {
            $this->mediaStorage->delete($stored['path']);

            throw $exception;
        }
    }

    public function destroy(Media $media): void
    {
        $path = $media->path;

        $media->delete();

        $this->mediaStorage->delete($path);
    }
}
