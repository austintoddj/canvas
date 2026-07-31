# Webhooks

## Introduction

When a post's **public** snapshot changes, Canvas dispatches Laravel events and may POST signed JSON to a URL you configure. Pending-only autosaves do not fire either.

## Domain events

| Event                           | When                              |
| ------------------------------- | --------------------------------- |
| `Canvas\Events\PostPublished`   | Post becomes live                 |
| `Canvas\Events\PostScheduled`   | Future `published_at` is set      |
| `Canvas\Events\PostUpdated`     | Live or scheduled content changes |
| `Canvas\Events\PostUnpublished` | `published_at` cleared            |
| `Canvas\Events\PostDeleted`     | Soft-deleted                      |

```php
use Canvas\Events\PostPublished;
use Illuminate\Support\Facades\Event;

Event::listen(PostPublished::class, function (PostPublished $event) {
    // $event->post
});
```

A scheduled post becomes visible when `published_at` elapses (no extra write is required for readers). Canvas also fires `PostPublished` at that moment via the scheduled `canvas:announce-scheduled` command (every minute). You still receive `PostScheduled` when a future date is set, and an editor save that moves a post to live fires `PostPublished` immediately without waiting for the poller.

## Configuring outbound webhooks

In the admin, open **Integrations → Webhooks**. Provide an HTTPS URL, choose events, and copy the signing secret (shown once). **Send test** delivers a signed `webhook.test` payload immediately.

| Event id           | Domain event      |
| ------------------ | ----------------- |
| `post.published`   | `PostPublished`   |
| `post.scheduled`   | `PostScheduled`   |
| `post.updated`     | `PostUpdated`     |
| `post.unpublished` | `PostUnpublished` |
| `post.deleted`     | `PostDeleted`     |

## Delivery

|                      |                                 |
| -------------------- | ------------------------------- |
| Method               | `POST`                          |
| Content-Type         | `application/json`              |
| `Canvas-Event`       | Event id                        |
| `Canvas-Delivery-Id` | Delivery UUID                   |
| `Canvas-Signature`   | `t={unix},v1={hex}`             |
| Success              | HTTP 2xx (retries with backoff) |

The signature is HMAC-SHA256 of `{timestamp}.{rawBody}` using your secret. Verify with `Canvas\Support\WebhookSigner::verify($secret, $rawBody, $header)`, and reject stale timestamps.

Lifecycle deliveries are queued. With a non-`sync` queue driver, run `queue:work` or jobs will sit after publish. **Send test** runs synchronously so failures surface in the UI.

Hosts must run the Laravel scheduler (`php artisan schedule:run` every minute) so `canvas:announce-scheduled` can emit `post.published` when scheduled posts go live by time.

## Payload

Payloads include metadata (id, slug, title, summary, dates, featured image, SEO meta, topic, tags, author). They do **not** include the full HTML body. Fetch the post in your app when you need the body.

```json
{
    "api_version": 1,
    "event": "post.published",
    "delivery_id": "…",
    "created_at": "2026-07-22T15:04:05+00:00",
    "data": {
        "id": "…",
        "slug": "…",
        "title": "…",
        "summary": "…",
        "published_at": "…",
        "featured_image": "…",
        "meta": {},
        "topic": { "name": "…", "slug": "…" },
        "tags": [{ "name": "…", "slug": "…" }],
        "author": { "id": 1, "name": "Jane", "username": "jane" }
    }
}
```
