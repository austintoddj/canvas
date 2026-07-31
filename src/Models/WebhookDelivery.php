<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\WebhookDeliveryFactory;
use Canvas\Enums\WebhookDeliveryStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @use HasFactory<WebhookDeliveryFactory>
 */
class WebhookDelivery extends Model
{
    /** @use HasFactory<WebhookDeliveryFactory> */
    use HasFactory;

    public const int MAX_PAYLOAD_BYTES = 32_768;

    public const int MAX_RESPONSE_BYTES = 4_096;

    public const int MAX_ERROR_BYTES = 500;

    protected $table = 'canvas_webhook_deliveries';

    /** @var list<string> */
    protected $guarded = [];

    protected $keyType = 'string';

    public $incrementing = false;

    protected $perPage = 15;

    /** @var array<string, string> */
    protected $casts = [
        'status' => WebhookDeliveryStatus::class,
        'http_status' => 'integer',
        'attempts' => 'integer',
        'payload' => 'array',
        'finished_at' => 'datetime',
    ];

    protected static function newFactory(): WebhookDeliveryFactory
    {
        return WebhookDeliveryFactory::new();
    }

    /**
     * @return BelongsTo<Post, $this>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'post_id');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function capPayload(array $payload): array
    {
        $encoded = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if (strlen($encoded) <= self::MAX_PAYLOAD_BYTES) {
            return $payload;
        }

        return [
            'api_version' => $payload['api_version'] ?? null,
            'event' => $payload['event'] ?? null,
            'delivery_id' => $payload['delivery_id'] ?? null,
            'created_at' => $payload['created_at'] ?? null,
            'data' => [
                'truncated' => true,
                'id' => data_get($payload, 'data.id'),
            ],
        ];
    }

    public static function capResponseBody(?string $body): ?string
    {
        if ($body === null || $body === '') {
            return null;
        }

        if (strlen($body) <= self::MAX_RESPONSE_BYTES) {
            return $body;
        }

        return substr($body, 0, self::MAX_RESPONSE_BYTES).'…';
    }

    public static function capErrorMessage(?string $message): ?string
    {
        if ($message === null || $message === '') {
            return null;
        }

        if (strlen($message) <= self::MAX_ERROR_BYTES) {
            return $message;
        }

        return substr($message, 0, self::MAX_ERROR_BYTES).'…';
    }

    public function markSuccess(?int $httpStatus, ?string $responseBody): void
    {
        $this->forceFill([
            'status' => WebhookDeliveryStatus::Success,
            'http_status' => $httpStatus,
            'response_body' => self::capResponseBody($responseBody),
            'error_message' => null,
            'finished_at' => now(),
        ])->save();
    }

    public function markFailed(?int $httpStatus, ?string $responseBody, ?string $errorMessage): void
    {
        $this->forceFill([
            'status' => WebhookDeliveryStatus::Failed,
            'http_status' => $httpStatus,
            'response_body' => self::capResponseBody($responseBody),
            'error_message' => self::capErrorMessage($errorMessage),
            'finished_at' => now(),
        ])->save();
    }

    public function recordAttempt(?int $httpStatus, ?string $responseBody, ?string $errorMessage): void
    {
        $this->forceFill([
            'http_status' => $httpStatus,
            'response_body' => self::capResponseBody($responseBody),
            'error_message' => self::capErrorMessage($errorMessage),
        ])->save();
    }

    public function incrementAttempts(): void
    {
        $this->forceFill([
            'attempts' => $this->attempts + 1,
        ])->save();
    }
}
