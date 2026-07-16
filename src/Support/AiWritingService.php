<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\AiProvider;
use Canvas\Enums\AiWritingAction;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

final class AiWritingService
{
    private const int TimeoutSeconds = 30;

    private const int MaxTokens = 4096;

    /**
     * @throws RuntimeException
     */
    public function rewrite(
        AiWritingAction $action,
        string $text,
        ?string $instruction = null,
        ?string $title = null,
    ): string {
        $provider = Ai::provider();
        $apiKey = Ai::apiKey();
        $model = Ai::model();

        if ($provider === null || $apiKey === null || $apiKey === '' || $model === null) {
            throw new RuntimeException('AI is not configured.');
        }

        $system = $this->systemPrompt($action, $instruction, $title);
        $user = $action->isGeneration()
            ? "Generate from the following post content:\n\n".$text
            : "Rewrite the following text:\n\n".$text;

        return match ($provider) {
            AiProvider::Xai, AiProvider::OpenAi => $this->chatCompletions($provider, $apiKey, $model, $system, $user),
            AiProvider::Anthropic => $this->anthropicMessages($apiKey, $model, $system, $user),
        };
    }

    private function systemPrompt(AiWritingAction $action, ?string $instruction, ?string $title): string
    {
        $parts = [
            'You are a writing assistant embedded in a blog editor.',
            $action->isGeneration()
                ? 'Return only the generated text as plain text.'
                : 'Return only the rewritten text as plain text.',
            'Do not wrap the result in quotes or markdown code fences.',
            'Do not add a preamble or explanation.',
            $action->instruction(),
        ];

        if ($action === AiWritingAction::Custom && filled($instruction)) {
            $parts[] = 'User instruction: '.$instruction;
        }

        if (filled($title) && ! $action->isGeneration()) {
            $parts[] = 'Post title for context: '.$title;
        }

        return implode(' ', $parts);
    }

    /**
     * @throws RuntimeException
     */
    private function chatCompletions(
        AiProvider $provider,
        string $apiKey,
        string $model,
        string $system,
        string $user,
    ): string {
        try {
            $response = Http::withToken($apiKey)
                ->timeout(self::TimeoutSeconds)
                ->acceptJson()
                ->post($provider->baseUrl().'/chat/completions', [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ['role' => 'user', 'content' => $user],
                    ],
                    'temperature' => 0.4,
                ]);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Unable to reach the AI provider.', 0, $e);
        }

        $this->assertSuccessful($response);

        $content = data_get($response->json(), 'choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('The AI provider returned an empty response.');
        }

        return $this->normalizeOutput($content);
    }

    /**
     * @throws RuntimeException
     */
    private function anthropicMessages(
        string $apiKey,
        string $model,
        string $system,
        string $user,
    ): string {
        try {
            $response = Http::withHeaders([
                'x-api-key' => $apiKey,
                'anthropic-version' => '2023-06-01',
            ])
                ->timeout(self::TimeoutSeconds)
                ->acceptJson()
                ->post(AiProvider::Anthropic->baseUrl().'/v1/messages', [
                    'model' => $model,
                    'max_tokens' => self::MaxTokens,
                    'system' => $system,
                    'messages' => [
                        ['role' => 'user', 'content' => $user],
                    ],
                ]);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Unable to reach the AI provider.', 0, $e);
        }

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
            throw new RuntimeException('The AI provider returned an empty response.');
        }

        return $this->normalizeOutput($text);
    }

    /**
     * @throws RuntimeException
     */
    private function assertSuccessful(Response $response): void
    {
        if ($response->successful()) {
            return;
        }

        $status = $response->status();
        $providerHint = $this->providerErrorHint($response);

        if ($status === 401) {
            throw new RuntimeException(
                'The AI API key was rejected. Re-paste the key in Integrations (without a “Bearer ” prefix).'
            );
        }

        if ($status === 403) {
            throw new RuntimeException(
                'The AI provider denied access. Confirm API credits, region/team permissions, and model access'
                .' in the provider console, or set a different model in Integrations.'
                .($providerHint !== null ? ' '.$providerHint : '')
            );
        }

        if ($status === 404) {
            throw new RuntimeException(
                'The AI model was not found. Set a valid model id in Integrations settings.'
                .($providerHint !== null ? ' '.$providerHint : '')
            );
        }

        if ($status === 429) {
            throw new RuntimeException('The AI provider rate limit was exceeded. Try again shortly.');
        }

        throw new RuntimeException(
            'The AI provider request failed.'
            .($providerHint !== null ? ' '.$providerHint : '')
        );
    }

    private function providerErrorHint(Response $response): ?string
    {
        $payload = $response->json();

        if (! is_array($payload)) {
            return null;
        }

        $message = data_get($payload, 'error.message')
            ?? data_get($payload, 'error')
            ?? data_get($payload, 'message');

        if (is_array($message)) {
            $message = data_get($message, 'message') ?? data_get($message, 'type');
        }

        if (! is_string($message)) {
            return null;
        }

        $message = trim($message);

        if ($message === '' || strlen($message) > 200) {
            return null;
        }

        if (preg_match('/bearer|api[_ -]?key|sk-[a-z0-9]|xai-[a-z0-9]/i', $message) === 1) {
            return null;
        }

        return '('.$message.')';
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
