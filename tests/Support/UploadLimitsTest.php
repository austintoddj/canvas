<?php

use Canvas\Support\UploadLimits;
use Illuminate\Http\Request;

it('parses php ini size strings into bytes', function (): void {
    expect(UploadLimits::iniBytes('2M'))->toBe(2 * 1024 * 1024)
        ->and(UploadLimits::iniBytes('512K'))->toBe(512 * 1024)
        ->and(UploadLimits::iniBytes('1G'))->toBe(1024 * 1024 * 1024)
        ->and(UploadLimits::iniBytes('2048'))->toBe(2048)
        ->and(UploadLimits::iniBytes('0'))->toBe(PHP_INT_MAX)
        ->and(UploadLimits::iniBytes(''))->toBe(PHP_INT_MAX)
        ->and(UploadLimits::iniBytes('bogus'))->toBe(PHP_INT_MAX);
});

it('applies multipart headroom to post_max_size when computing the php file cap', function (): void {
    $postMax = 2 * 1024 * 1024;
    $uploadMax = 2 * 1024 * 1024;

    expect(UploadLimits::effectivePhpMaxFileBytes($postMax, $uploadMax))
        ->toBe($postMax - UploadLimits::MULTIPART_HEADROOM_BYTES);
});

it('uses the lower of upload_max_filesize and post_max with headroom', function (): void {
    $postMax = 8 * 1024 * 1024;
    $uploadMax = 2 * 1024 * 1024;

    expect(UploadLimits::effectivePhpMaxFileBytes($postMax, $uploadMax))->toBe($uploadMax);
});

it('ignores unlimited php sides when computing the php file cap', function (): void {
    $uploadMax = 3 * 1024 * 1024;

    expect(UploadLimits::effectivePhpMaxFileBytes(PHP_INT_MAX, $uploadMax))->toBe($uploadMax)
        ->and(UploadLimits::effectivePhpMaxFileBytes(2 * 1024 * 1024, PHP_INT_MAX))
        ->toBe((2 * 1024 * 1024) - UploadLimits::MULTIPART_HEADROOM_BYTES)
        ->and(UploadLimits::effectivePhpMaxFileBytes(PHP_INT_MAX, PHP_INT_MAX))->toBe(PHP_INT_MAX);
});

it('clamps the configured upload size to the php file cap', function (): void {
    config(['canvas.upload_filesize' => 3_145_728]);

    $phpCap = UploadLimits::phpMaxFileBytes();
    $max = UploadLimits::maxBytes();

    expect($max)->toBe(min(3_145_728, $phpCap))
        ->and($max)->toBeLessThanOrEqual($phpCap)
        ->and(UploadLimits::maxKilobytes())->toBe(max(1, (int) floor($max / 1024)));
});

it('never exceeds the configured upload size when php allows more', function (): void {
    config(['canvas.upload_filesize' => 1_048_576]);

    expect(UploadLimits::maxBytes())->toBeLessThanOrEqual(1_048_576);
});

it('formats human-readable sizes and too-large messages', function (): void {
    expect(UploadLimits::formatBytes(500))->toBe('500 B')
        ->and(UploadLimits::formatBytes(2048))->toBe('2 KB')
        ->and(UploadLimits::formatBytes(2_031_616))->toBe('1.9 MB')
        ->and(UploadLimits::formatBytes(3_145_728))->toBe('3 MB')
        ->and(UploadLimits::tooLargeMessage(2_031_616))
        ->toBe('File is too large. Maximum size is 1.9 MB.')
        ->and(UploadLimits::tooLargeMessage(2_031_616, 'de'))
        ->toBe('Die Datei ist zu groß. Maximale Größe ist 1.9 MB.')
        ->and(UploadLimits::tooLargeMessageGeneric('es-ES'))
        ->toBe('El archivo es demasiado grande. Prueba con una imagen más pequeña.');
});

it('detects canvas api requests by path prefix', function (): void {
    config(['canvas.path' => 'canvas']);

    expect(UploadLimits::isCanvasApiRequest(Request::create('/canvas/api/media/abc', 'POST')))->toBeTrue()
        ->and(UploadLimits::isCanvasApiRequest(Request::create('/canvas/api/posts', 'GET')))->toBeTrue()
        ->and(UploadLimits::isCanvasApiRequest(Request::create('/canvas', 'GET')))->toBeFalse()
        ->and(UploadLimits::isCanvasApiRequest(Request::create('/api/media', 'POST')))->toBeFalse();
});
