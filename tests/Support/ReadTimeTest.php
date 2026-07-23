<?php

use Canvas\Support\ReadTime;

it('returns zero minutes for empty or null body', function (?string $text): void {
    expect(ReadTime::calculate($text, 'en'))->toBe('0 mins read');
})->with([
    'null' => [null],
    'empty string' => [''],
    'html only' => ['<p></p>'],
]);

it('strips html before counting words', function (): void {
    $body = str_repeat('<p>word</p> ', 250);

    expect(ReadTime::calculate($body, 'en'))->toBe('1 min read');
});

it('rounds up partial minutes', function (): void {
    $body = str_repeat('word ', 251);

    expect(ReadTime::calculate($body, 'en'))->toBe('2 mins read');
});

it('uses the given locale for translated units', function (): void {
    $result = ReadTime::calculate('hello world', 'en');

    expect($result)->toContain('min')->toContain('read');
});
