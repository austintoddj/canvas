<?php

use Canvas\Enums\AiProvider;

it('maps provider labels', function (): void {
    expect(AiProvider::Xai->label())->toBe('Grok (xAI)')
        ->and(AiProvider::OpenAi->label())->toBe('ChatGPT (OpenAI)')
        ->and(AiProvider::Anthropic->label())->toBe('Claude (Anthropic)');
});

it('exposes fast defaults and expert presets', function (AiProvider $provider, string $fast, string $expert): void {
    expect($provider->defaultModel())->toBe($fast)
        ->and($provider->expertModel())->toBe($expert);

    $presets = $provider->modelPresets();

    expect($presets)->toHaveCount(3)
        ->and($presets[0])->toMatchArray(['tier' => 'auto', 'model' => null, 'label' => 'Default'])
        ->and($presets[1])->toMatchArray(['tier' => 'fast', 'model' => $fast, 'label' => 'Fast'])
        ->and($presets[2])->toMatchArray(['tier' => 'expert', 'model' => $expert, 'label' => 'Expert']);
})->with([
    [AiProvider::Xai, 'grok-4.3', 'grok-4.5'],
    [AiProvider::OpenAi, 'gpt-4o-mini', 'gpt-5.6-terra'],
    [AiProvider::Anthropic, 'claude-haiku-4-5', 'claude-sonnet-5'],
]);

it('exposes string values for validation', function (): void {
    expect(AiProvider::values())->toBe(['xai', 'openai', 'anthropic']);
});

it('maps provider base urls', function (): void {
    expect(AiProvider::Xai->baseUrl())->toBe('https://api.x.ai/v1')
        ->and(AiProvider::OpenAi->baseUrl())->toBe('https://api.openai.com/v1')
        ->and(AiProvider::Anthropic->baseUrl())->toBe('https://api.anthropic.com');
});

it('maps provider console urls for integrations help', function (): void {
    expect(AiProvider::Xai->consoleUrl())->toBe('https://console.x.ai')
        ->and(AiProvider::OpenAi->consoleUrl())->toBe('https://platform.openai.com/api-keys')
        ->and(AiProvider::Anthropic->consoleUrl())->toBe('https://console.anthropic.com/settings/keys');
});
