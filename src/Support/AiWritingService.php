<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\AiProvider;
use Canvas\Enums\AiWritingAction;
use Canvas\Exceptions\AiWritingException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final class AiWritingService
{
    /**
     * Stay under typical web max_execution_time (30s) so timeouts surface as
     * catchable ConnectionExceptions instead of fatal PHP deaths.
     */
    private const int TimeoutSeconds = 25;

    private const int MaxTokensRewrite = 2048;

    private const int MaxTokensSeo = 400;

    private const int MaxRetries = 1;

    private const int RetryDelayMicroseconds = 1_000_000;

    /**
     * @return string|array{title: string, description: string}
     *
     * @throws AiWritingException
     */
    public function rewrite(
        AiWritingAction $action,
        string $text,
        ?string $instruction = null,
        ?string $title = null,
    ): string|array {
        $provider = Ai::provider();
        $apiKey = Ai::apiKey();
        $model = Ai::model();

        if ($provider === null || $apiKey === null || $apiKey === '' || $model === null) {
            throw new AiWritingException('AI is not configured.', AiWritingException::CodeNotConfigured);
        }

        $system = $this->systemPrompt($action, $instruction, $title);
        $user = $action->isGeneration()
            ? "Generate from the following post content:\n\n".$text
            : "Rewrite the following text:\n\n".$text;
        $maxTokens = $this->maxTokensFor($action);

        $raw = match ($provider) {
            AiProvider::Xai, AiProvider::OpenAi => $this->chatCompletions(
                $provider,
                $apiKey,
                $model,
                $system,
                $user,
                $maxTokens,
            ),
            AiProvider::Anthropic => $this->anthropicMessages($apiKey, $model, $system, $user, $maxTokens),
        };

        if ($action->isSeoSuggest()) {
            return $this->parseSeoSuggestion($raw);
        }

        return $raw;
    }

    private function maxTokensFor(AiWritingAction $action): int
    {
        return $action->isSeoSuggest() ? self::MaxTokensSeo : self::MaxTokensRewrite;
    }

    private function systemPrompt(AiWritingAction $action, ?string $instruction, ?string $title): string
    {
        $parts = [
            'You are a writing assistant embedded in a blog editor.',
            $action->isSeoSuggest()
                ? 'Return only the JSON object described in the task.'
                : 'Return only the rewritten text as plain text.',
            'Do not wrap the result in quotes or markdown code fences.',
            'Do not add a preamble or explanation.',
            $action->isSeoSuggest()
                ? null
                : 'Preserve paragraph structure: separate paragraphs with a blank line. Do not merge distinct paragraphs into one.',
            $action->instruction(),
        ];

        $parts = array_values(array_filter($parts, static fn (?string $part): bool => $part !== null && $part !== ''));

        if ($action === AiWritingAction::Custom && filled($instruction)) {
            $parts[] = 'User instruction: '.$instruction;
        }

        if (filled($title)) {
            $parts[] = 'Post title for context: '.$title;
        }

        return implode(' ', $parts);
    }

    /**
     * @throws AiWritingException
     */
    private function chatCompletions(
        AiProvider $provider,
        string $apiKey,
        string $model,
        string $system,
        string $user,
        int $maxTokens,
    ): string {
        $response = $this->sendWithRetry(
            fn (): Response => Http::withToken($apiKey)
                ->timeout(self::TimeoutSeconds)
                ->acceptJson()
                ->post($provider->baseUrl().'/chat/completions', [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ['role' => 'user', 'content' => $user],
                    ],
                    'temperature' => 0.4,
                    'max_tokens' => $maxTokens,
                ])
        );

        $this->assertSuccessful($response);

        $content = data_get($response->json(), 'choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new AiWritingException(
                'The AI provider returned an empty response.',
                AiWritingException::CodeEmpty,
            );
        }

        return $this->normalizeOutput($content);
    }

    /**
     * @throws AiWritingException
     */
    private function anthropicMessages(
        string $apiKey,
        string $model,
        string $system,
        string $user,
        int $maxTokens,
    ): string {
        $response = $this->sendWithRetry(
            fn (): Response => Http::withHeaders([
                'x-api-key' => $apiKey,
                'anthropic-version' => '2023-06-01',
            ])
                ->timeout(self::TimeoutSeconds)
                ->acceptJson()
                ->post(AiProvider::Anthropic->baseUrl().'/v1/messages', [
                    'model' => $model,
                    'max_tokens' => $maxTokens,
                    'system' => $system,
                    'messages' => [
                        ['role' => 'user', 'content' => $user],
                    ],
                ])
        );

        $this->assertSuccessful($response);

        $blocks = data_get($response->json(), 'content');
        $text = '';

        if (is_array($blocks)) {
            foreach ($blocks as $block) {
                if (is_array($block) && ($block['type'] ?? null) === 'text' && is_string($block['text'] ?? null)) {
                    $text .= $block['text'];
                }
            }
        }

        if (trim($text) === '') {
            throw new AiWritingException(
                'The AI provider returned an empty response.',
                AiWritingException::CodeEmpty,
            );
        }

        return $this->normalizeOutput($text);
    }

    /**
     * @param  callable(): Response  $request
     *
     * @throws AiWritingException
     */
    private function sendWithRetry(callable $request): Response
    {
        $attempt = 0;

        while (true) {
            $attempt++;

            try {
                $response = $request();
            } catch (ConnectionException $e) {
                throw new AiWritingException(
                    'The AI provider took too long or could not be reached. Try again, or set a faster model in Integrations.',
                    AiWritingException::CodeTimeout,
                    $e,
                );
            }

            if ($response->successful()) {
                return $response;
            }

            $status = $response->status();
            // Retry transient rate limits / gateway errors, not quota/billing failures.
            $retriable = in_array($status, [429, 502, 503], true)
                && ! ($status === 429 && $this->looksLikeQuotaError($this->parseProviderError($response)));

            if ($retriable && $attempt <= self::MaxRetries) {
                usleep(self::RetryDelayMicroseconds);

                continue;
            }

            return $response;
        }
    }

    /**
     * @throws AiWritingException
     */
    private function assertSuccessful(Response $response): void
    {
        if ($response->successful()) {
            return;
        }

        $status = $response->status();
        $parsed = $this->parseProviderError($response);
        $detail = $parsed['detail'];

        if ($status === 401) {
            throw new AiWritingException(
                'The AI API key was rejected. Re-paste the key in Integrations (without a “Bearer ” prefix).',
                AiWritingException::CodeUnauthorized,
                detail: $detail,
            );
        }

        if ($this->looksLikeQuotaError($parsed)) {
            throw new AiWritingException(
                'The AI provider reports insufficient credits or quota. Check billing in the provider console, or switch provider in Integrations.',
                AiWritingException::CodeQuotaExceeded,
                detail: $detail,
            );
        }

        if ($this->looksLikeContextLengthError($parsed)) {
            throw new AiWritingException(
                'Selection or post content is too long for this model. Shorten the text and try again.',
                AiWritingException::CodeContextLength,
                detail: $detail,
            );
        }

        if ($status === 403) {
            throw new AiWritingException(
                'The AI provider denied access. Confirm API credits, region/team permissions, and model access'
                .' in the provider console, or set a different model in Integrations.',
                AiWritingException::CodeForbidden,
                detail: $detail,
            );
        }

        if ($status === 404) {
            throw new AiWritingException(
                'The AI model was not found. Set a valid model id in Integrations settings.',
                AiWritingException::CodeModelNotFound,
                detail: $detail,
            );
        }

        if ($status === 429) {
            throw new AiWritingException(
                'The AI provider rate limit was exceeded. Try again shortly.',
                AiWritingException::CodeRateLimited,
                detail: $detail,
            );
        }

        Log::warning('Canvas AI provider request failed.', [
            'status' => $status,
            'detail' => $detail,
            'provider_code' => $parsed['code'],
            'provider_type' => $parsed['type'],
        ]);

        throw new AiWritingException(
            'Could not complete the AI request. Try again.',
            AiWritingException::CodeFailed,
            detail: $detail,
        );
    }

    /**
     * @return array{detail: ?string, code: ?string, type: ?string, message: ?string}
     */
    private function parseProviderError(Response $response): array
    {
        $payload = $response->json();

        if (! is_array($payload)) {
            return ['detail' => null, 'code' => null, 'type' => null, 'message' => null];
        }

        $error = $payload['error'] ?? null;
        $code = null;
        $type = null;
        $message = null;

        if (is_array($error)) {
            $rawMessage = $error['message'] ?? null;
            if (is_string($rawMessage)) {
                $message = $rawMessage;
            } elseif (is_array($rawMessage)) {
                // Some gateways nest message as { message|type: "..." }.
                $nestedMessage = $rawMessage['message'] ?? $rawMessage['type'] ?? null;
                $message = is_string($nestedMessage) ? $nestedMessage : null;
            }

            $rawCode = $error['code'] ?? null;
            $code = is_string($rawCode) ? $rawCode : null;
            $rawType = $error['type'] ?? null;
            $type = is_string($rawType) ? $rawType : null;
        } elseif (is_string($error)) {
            $message = $error;
        }

        if ($message === null) {
            $topMessage = $payload['message'] ?? null;
            $message = is_string($topMessage) ? $topMessage : null;
        }

        if ($type === null) {
            $topType = $payload['type'] ?? null;
            $type = is_string($topType) ? $topType : null;
        }

        $message = is_string($message) ? trim($message) : null;
        if ($message === '') {
            $message = null;
        }

        $code = is_string($code) ? trim($code) : null;
        if ($code === '') {
            $code = null;
        }

        $type = is_string($type) ? trim($type) : null;
        if ($type === '') {
            $type = null;
        }

        return [
            'detail' => $this->sanitizeProviderDetail($message),
            'code' => $code,
            'type' => $type,
            'message' => $message,
        ];
    }

    private function sanitizeProviderDetail(?string $message): ?string
    {
        if ($message === null) {
            return null;
        }

        $message = trim($message);

        if ($message === '' || strlen($message) > 200) {
            return null;
        }

        if (preg_match('/bearer|api[_ -]?key|sk-[a-z0-9]|xai-[a-z0-9]/i', $message) === 1) {
            return null;
        }

        return $message;
    }

    /**
     * @param  array{detail: ?string, code: ?string, type: ?string, message: ?string}  $parsed
     */
    private function looksLikeQuotaError(array $parsed): bool
    {
        $haystack = strtolower(implode(' ', array_filter([
            $parsed['code'],
            $parsed['type'],
            $parsed['message'],
        ])));

        if ($haystack === '') {
            return false;
        }

        foreach ([
            'insufficient_quota',
            'billing_not_active',
            'billing_hard_limit',
            'insufficient credit',
            'insufficient credits',
            'insufficient quota',
            'exceeded your current quota',
            'credit balance',
            'purchase credits',
            'out of credits',
            'out of quota',
            'quota exceeded',
            'payment required',
        ] as $needle) {
            if (str_contains($haystack, $needle)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array{detail: ?string, code: ?string, type: ?string, message: ?string}  $parsed
     */
    private function looksLikeContextLengthError(array $parsed): bool
    {
        $haystack = strtolower(implode(' ', array_filter([
            $parsed['code'],
            $parsed['type'],
            $parsed['message'],
        ])));

        if ($haystack === '') {
            return false;
        }

        foreach ([
            'context_length_exceeded',
            'context length',
            'maximum context',
            'max context',
            'too many tokens',
            'prompt is too long',
            'request_too_large',
            'request too large',
            'token limit',
            'max_tokens',
            'exceeds the model',
            'exceeds model',
        ] as $needle) {
            if (str_contains($haystack, $needle)) {
                return true;
            }
        }

        // e.g. "maximum number of tokens", "max tokens exceeded"
        if (preg_match('/\b(max(imum)?\s+)?tokens?\b.*\b(exceed|limit|long|large)\b|\b(exceed|limit|long|large)\b.*\btokens?\b/i', $haystack) === 1) {
            return true;
        }

        return false;
    }

    /**
     * @return array{title: string, description: string}
     *
     * @throws AiWritingException
     */
    private function parseSeoSuggestion(string $raw): array
    {
        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            if (preg_match('/\{.*\}/s', $raw, $matches) === 1) {
                $decoded = json_decode($matches[0], true);
            }
        }

        if (! is_array($decoded)) {
            throw new AiWritingException(
                'The AI provider returned an unusable SEO suggestion.',
                AiWritingException::CodeEmpty,
            );
        }

        $title = $decoded['title'] ?? null;
        $description = $decoded['description'] ?? null;

        if (! is_string($title) || ! is_string($description)) {
            throw new AiWritingException(
                'The AI provider returned an unusable SEO suggestion.',
                AiWritingException::CodeEmpty,
            );
        }

        $title = trim($title);
        $description = trim($description);

        if ($title === '' || $description === '') {
            throw new AiWritingException(
                'The AI provider returned an empty SEO suggestion.',
                AiWritingException::CodeEmpty,
            );
        }

        return [
            'title' => $title,
            'description' => $description,
        ];
    }

    private function normalizeOutput(string $content): string
    {
        $trimmed = trim($content);

        if (preg_match('/^```(?:\w+)?\s*\n?(.*?)\n?```$/s', $trimmed, $matches) === 1) {
            return trim($matches[1]);
        }

        return $trimmed;
    }
}
