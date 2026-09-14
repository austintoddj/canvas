<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\AiProvider;
use Canvas\Exceptions\IntegrationVerificationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Live credential probes used before an integration is marked enabled.
 *
 * 2xx and 429 (throttled but authentic) count as valid. 401/403, timeouts,
 * and unreachable hosts do not persist new credentials.
 */
final class IntegrationVerifier
{
    private const int TimeoutSeconds = 8;

    /**
     * @throws IntegrationVerificationException
     */
    public function verifyAi(AiProvider $provider, string $apiKey, ?string $model): void
    {
        $response = $this->send(
            fn (): Response => $this->aiModelsRequest($provider, $apiKey),
            'ai.api_key',
            'Could not reach the AI provider. Try again.',
        );

        if ($this->isRejected($response)) {
            throw new IntegrationVerificationException(
                'ai.api_key',
                'The API key was rejected by this provider. Check the key and that it matches the selected provider.',
                IntegrationVerificationException::CodeUnauthorized,
            );
        }

        if ($this->isValid($response)) {
            $this->assertModelAvailable($response, $model);

            return;
        }

        throw new IntegrationVerificationException(
            'ai.api_key',
            'Could not verify the AI API key. Try again.',
            IntegrationVerificationException::CodeFailed,
        );
    }

    /**
     * @throws IntegrationVerificationException
     */
    public function verifyUnsplash(string $accessKey): void
    {
        $response = $this->send(
            fn (): Response => Http::timeout(self::TimeoutSeconds)
                ->withHeaders([
                    'Authorization' => 'Client-ID '.$accessKey,
                    'Accept-Version' => 'v1',
                ])
                ->acceptJson()
                ->get('https://api.unsplash.com/photos', ['per_page' => 1]),
            'unsplash.access_key',
            'Could not reach Unsplash. Try again.',
        );

        if ($this->isRejected($response)) {
            throw new IntegrationVerificationException(
                'unsplash.access_key',
                'The Unsplash access key was rejected.',
                IntegrationVerificationException::CodeUnauthorized,
            );
        }

        if ($this->isValid($response)) {
            return;
        }

        throw new IntegrationVerificationException(
            'unsplash.access_key',
            'Could not verify the Unsplash access key. Try again.',
            IntegrationVerificationException::CodeFailed,
        );
    }

    /**
     * @param  callable(): Response  $request
     *
     * @throws IntegrationVerificationException
     */
    private function send(callable $request, string $field, string $unreachableMessage): Response
    {
        try {
            return $request();
        } catch (ConnectionException $exception) {
            throw new IntegrationVerificationException(
                $field,
                $unreachableMessage,
                IntegrationVerificationException::CodeUnreachable,
                $exception,
            );
        }
    }

    private function aiModelsRequest(AiProvider $provider, string $apiKey): Response
    {
        $request = Http::timeout(self::TimeoutSeconds)->acceptJson();

        if ($provider === AiProvider::Anthropic) {
            return $request
                ->withHeaders([
                    'x-api-key' => $apiKey,
                    'anthropic-version' => '2023-06-01',
                ])
                ->get($provider->baseUrl().'/v1/models');
        }

        return $request
            ->withToken($apiKey)
            ->get($provider->baseUrl().'/models');
    }

    /**
     * @throws IntegrationVerificationException
     */
    private function assertModelAvailable(Response $response, ?string $model): void
    {
        if ($model === null || $model === '' || $response->status() === 429) {
            return;
        }

        $ids = $this->modelIds($response);

        if ($ids === [] || in_array($model, $ids, true)) {
            return;
        }

        throw new IntegrationVerificationException(
            'ai.model',
            'That model id was not found for this provider.',
            IntegrationVerificationException::CodeModelNotFound,
        );
    }

    /**
     * @return list<string>
     */
    private function modelIds(Response $response): array
    {
        $data = $response->json('data');

        if (! is_array($data)) {
            return [];
        }

        $ids = [];

        foreach ($data as $row) {
            if (! is_array($row)) {
                continue;
            }

            $id = $row['id'] ?? null;

            if (is_string($id) && $id !== '') {
                $ids[] = $id;
            }
        }

        return $ids;
    }

    private function isValid(Response $response): bool
    {
        return $response->successful() || $response->status() === 429;
    }

    private function isRejected(Response $response): bool
    {
        return in_array($response->status(), [401, 403], true);
    }
}
