<?php

declare(strict_types=1);

namespace Canvas\Exceptions;

use RuntimeException;
use Throwable;

final class AiWritingException extends RuntimeException
{
    public const string CodeNotConfigured = 'ai_not_configured';

    public const string CodeTimeout = 'ai_timeout';

    public const string CodeUnreachable = 'ai_unreachable';

    public const string CodeRateLimited = 'ai_rate_limited';

    public const string CodeUnauthorized = 'ai_unauthorized';

    public const string CodeForbidden = 'ai_forbidden';

    public const string CodeModelNotFound = 'ai_model_not_found';

    public const string CodeEmpty = 'ai_empty';

    public const string CodeFailed = 'ai_failed';

    public const string CodeContextLength = 'ai_context_length';

    public const string CodeQuotaExceeded = 'ai_quota_exceeded';

    public function __construct(
        string $message,
        public readonly string $errorCode = self::CodeFailed,
        ?Throwable $previous = null,
        public readonly ?string $detail = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}
