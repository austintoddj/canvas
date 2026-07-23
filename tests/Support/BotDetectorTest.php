<?php

use Canvas\Support\BotDetector;

it('identifies null and empty agents as bots', function (): void {
    expect(BotDetector::isBot(null))->toBeTrue();
    expect(BotDetector::isBot(''))->toBeTrue();
});

it('identifies known crawler user-agents as bots', function (string $agent): void {
    expect(BotDetector::isBot($agent))->toBeTrue();
})->with([
    'Googlebot/2.1 (+http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'AhrefsBot/7.0 (+http://ahrefs.com/robot/)',
    'SemrushBot/7~bl (+https://www.semrush.com/bot.html)',
    'facebookexternalhit/1.1',
    'Twitterbot/1.0',
    'LinkedInBot/1.0',
    'python-requests/2.28.0',
    'curl/7.88.1',
    'Wget/1.21.3',
    'Go-http-client/1.1',
    'PostmanRuntime/7.32.3',
    'axios/1.4.0',
]);

it('does not identify real browser user-agents as bots', function (string $agent): void {
    expect(BotDetector::isBot($agent))->toBeFalse();
})->with([
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
]);
