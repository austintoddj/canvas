<?php

use Canvas\Enums\MediaType;

it('maps image mime types to the image media type', function (string $mime): void {
    expect(MediaType::fromMimeType($mime))->toBe(MediaType::Image);
})->with([
    'jpeg' => ['image/jpeg'],
    'png' => ['image/png'],
    'gif' => ['image/gif'],
    'webp' => ['image/webp'],
    'svg' => ['image/svg+xml'],
]);

it('returns null for non-image mime types', function (string $mime): void {
    expect(MediaType::fromMimeType($mime))->toBeNull();
})->with([
    'pdf' => ['application/pdf'],
    'video' => ['video/mp4'],
    'text' => ['text/plain'],
    'empty' => [''],
]);

it('exposes the image case value for api payloads', function (): void {
    expect(MediaType::Image->value)->toBe('image');
});
