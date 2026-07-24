<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Models\Post;

final class PostSeo
{
    /**
     * @return array{
     *     title: string,
     *     description: string,
     *     canonical_url: string,
     *     image_url: string|null,
     *     image_alt: string
     * }
     */
    public static function resolve(Post $post, string $canonicalUrl): array
    {
        /** @var array<string, mixed>|null $meta */
        $meta = is_array($post->meta) ? $post->meta : null;

        $metaTitle = self::stringMeta($meta, 'title');
        $metaDescription = self::stringMeta($meta, 'description');
        $metaCanonical = self::stringMeta($meta, 'canonical_link');

        $postTitle = trim((string) $post->title);
        $title = $metaTitle !== '' ? $metaTitle : ($postTitle !== '' ? $postTitle : 'Untitled post');

        $summary = trim((string) ($post->summary ?? ''));
        $bodyDescription = self::truncate(self::stripHtml($post->body), 160);

        $description = $metaDescription !== ''
            ? $metaDescription
            : ($summary !== '' ? $summary : ($bodyDescription !== '' ? $bodyDescription : 'No description available.'));

        $rawImage = filled($post->featured_image)
            ? (string) $post->featured_image
            : self::firstImageSrc($post->body);

        $imageUrl = MediaUrl::absolute($rawImage);

        $imageAlt = trim((string) ($post->featured_image_caption ?? ''));
        if ($imageAlt === '') {
            $imageAlt = $postTitle !== '' ? $postTitle : $title;
        }

        return [
            'title' => $title,
            'description' => $description,
            'canonical_url' => $metaCanonical !== '' ? $metaCanonical : $canonicalUrl,
            'image_url' => $imageUrl,
            'image_alt' => $imageAlt,
        ];
    }

    public static function stripHtml(?string $html): string
    {
        if ($html === null || $html === '') {
            return '';
        }

        $text = preg_replace('/<script[\s\S]*?<\/script>/i', '', $html) ?? '';
        $text = preg_replace('/<style[\s\S]*?<\/style>/i', '', $text) ?? '';
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text) ?? '';

        return trim($text);
    }

    public static function truncate(string $text, int $maxLength): string
    {
        if (mb_strlen($text) <= $maxLength) {
            return $text;
        }

        $trimmed = rtrim(mb_substr($text, 0, $maxLength));
        $trimmed = preg_replace('/\s+\S*$/u', '', $trimmed) ?? $trimmed;

        return $trimmed.'…';
    }

    public static function firstImageSrc(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return null;
        }

        if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $html, $matches) !== 1) {
            return null;
        }

        $src = trim($matches[1]);

        return $src !== '' ? $src : null;
    }

    /**
     * @param  array<string, mixed>|null  $meta
     */
    private static function stringMeta(?array $meta, string $key): string
    {
        if ($meta === null || ! array_key_exists($key, $meta)) {
            return '';
        }

        $value = $meta[$key];

        if (! is_string($value)) {
            return '';
        }

        return trim($value);
    }
}
