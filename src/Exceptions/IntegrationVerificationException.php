<?php

declare(strict_types=1);

namespace Canvas\Exceptions;

use RuntimeException;
use Throwable;

final class IntegrationVerificationException extends RuntimeException
{
    public const string CodeUnauthorized = 'integration_unauthorized';

    public const string CodeUnreachable = 'integration_unreachable';

    public const string CodeModelNotFound = 'integration_model_not_found';

    public const string CodeFailed = 'integration_failed';

    public function __construct(
        public readonly string $field,
        string $message,
        public readonly string $errorCode = self::CodeFailed,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}
