<?php

declare(strict_types=1);

namespace Canvas\Support;

use DOMAttr;
use DOMDocument;
use DOMElement;
use DOMNode;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Throwable;

/**
 * Post body HTML is stored from the editor and rendered unescaped.
 * Safe documents are returned unchanged so pending diffs stay byte-stable.
 */
final class PostBody
{
    /** @var list<string> */
    private const DROPPED_TAGS = [
        'applet',
        'base',
        'embed',
        'form',
        'frame',
        'frameset',
        'link',
        'math',
        'meta',
        'noembed',
        'noframes',
        'noscript',
        'object',
        'script',
        'style',
        'svg',
        'template',
        'textarea',
        'title',
        'xml',
        'xmp',
    ];

    /** @var list<string> */
    private const ALLOWED_TAGS = [
        'a',
        'audio',
        'b',
        'blockquote',
        'br',
        'caption',
        'code',
        'col',
        'colgroup',
        'dd',
        'del',
        'div',
        'dl',
        'dt',
        'em',
        'figcaption',
        'figure',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hr',
        'i',
        'iframe',
        'img',
        'input',
        'label',
        'li',
        'mark',
        'ol',
        'p',
        'pre',
        's',
        'source',
        'span',
        'strike',
        'strong',
        'sub',
        'sup',
        'table',
        'tbody',
        'td',
        'tfoot',
        'th',
        'thead',
        'tr',
        'u',
        'ul',
        'video',
    ];

    /** @var list<string> */
    private const URL_ATTRIBUTES = [
        'action',
        'background',
        'cite',
        'data-src',
        'formaction',
        'href',
        'poster',
        'src',
        'xlink:href',
    ];

    /**
     * @return Attribute<?string, ?string>
     */
    public static function eloquentAttribute(): Attribute
    {
        return Attribute::make(
            get: static fn (mixed $value): ?string => self::clean(is_string($value) ? $value : null),
            set: static function (mixed $value): ?string {
                if ($value === null) {
                    return null;
                }

                if (! is_string($value)) {
                    return null;
                }

                return self::clean($value);
            },
        );
    }

    public static function clean(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return $html;
        }

        if (! str_contains($html, '<')) {
            return $html;
        }

        $document = self::load($html);

        if (! $document instanceof DOMDocument) {
            return self::escape($html);
        }

        if (! self::documentNeedsCleaning($document)) {
            return $html;
        }

        $clean = self::rebuild($document);
        $again = self::load($clean);

        if (! $again instanceof DOMDocument || self::documentNeedsCleaning($again)) {
            return self::escape($html);
        }

        return $clean;
    }

    /**
     * @param  array<string, mixed>  $pending
     * @return array<string, mixed>
     */
    public static function cleanPending(array $pending): array
    {
        if (! array_key_exists('body', $pending)) {
            return $pending;
        }

        $body = $pending['body'];

        if ($body !== null && ! is_string($body)) {
            return $pending;
        }

        $clean = self::clean($body);

        if ($clean === $body) {
            return $pending;
        }

        $pending['body'] = $clean;

        return $pending;
    }

    private static function load(string $html): ?DOMDocument
    {
        $document = new DOMDocument;
        $previous = libxml_use_internal_errors(true);

        try {
            $loaded = $document->loadHTML(
                '<?xml encoding="UTF-8">'.$html,
                LIBXML_HTML_NODEFDTD | LIBXML_NONET
            );
        } catch (Throwable) {
            $loaded = false;
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        if ($loaded !== true) {
            return null;
        }

        return $document;
    }

    private static function documentNeedsCleaning(DOMDocument $document): bool
    {
        foreach ($document->getElementsByTagName('*') as $node) {
            $tag = strtolower($node->tagName);

            if ($tag === 'html' || $tag === 'body') {
                continue;
            }

            if (self::elementNeedsCleaning($node)) {
                return true;
            }
        }

        return false;
    }

    private static function elementNeedsCleaning(DOMElement $element): bool
    {
        $tag = strtolower($element->tagName);

        if ($tag === 'iframe') {
            if (self::iframeNeedsCleaning($element)) {
                return true;
            }
        } elseif ($tag === 'meta') {
            if (strtolower($element->getAttribute('http-equiv')) !== '') {
                return true;
            }
        } elseif (in_array($tag, self::DROPPED_TAGS, true)) {
            return true;
        }

        foreach (self::attributes($element) as $attribute) {
            $name = strtolower($attribute->name);

            if (str_starts_with($name, 'on') || $name === 'srcdoc') {
                return true;
            }

            if ($name === 'style' && self::styleNeedsCleaning($attribute->value)) {
                return true;
            }

            if (self::attributeValueIsDangerous($name, $attribute->value, $tag)) {
                return true;
            }
        }

        return false;
    }

    private static function iframeNeedsCleaning(DOMElement $element): bool
    {
        if ($element->hasAttribute('srcdoc')) {
            return true;
        }

        return ! self::isHttpsUrl($element->getAttribute('src'));
    }

    private static function attributeValueIsDangerous(string $name, string $value, string $tag): bool
    {
        if ($tag === 'iframe' && $name === 'src') {
            return ! self::isHttpsUrl($value);
        }

        if ($name === 'data-src') {
            return $value !== '' && ! self::isHttpsUrl($value);
        }

        if (! in_array($name, self::URL_ATTRIBUTES, true)) {
            return false;
        }

        return self::isDangerousUrl($value);
    }

    private static function isHttpsUrl(string $value): bool
    {
        $normalized = self::normalizeUrl($value);

        if ($normalized === '' || ! preg_match('/^https:\/\//i', $normalized)) {
            return false;
        }

        if (self::isDangerousUrl($value)) {
            return false;
        }

        $parts = parse_url($normalized);

        if (! is_array($parts)) {
            return false;
        }

        $host = $parts['host'] ?? null;

        return strtolower((string) ($parts['scheme'] ?? '')) === 'https'
            && is_string($host)
            && $host !== '';
    }

    private static function isDangerousUrl(string $value): bool
    {
        $normalized = self::normalizeUrl($value);

        if (preg_match('/^(?:javascript|vbscript|blob|file):/i', $normalized) === 1) {
            return true;
        }

        if (preg_match('/^data:/i', $normalized) !== 1) {
            return false;
        }

        return preg_match('/^data:image\/(?:png|gif|jpe?g|webp|avif|bmp|x-icon|vnd\.microsoft\.icon)[;,]/i', $normalized) !== 1;
    }

    private static function normalizeUrl(string $value): string
    {
        $stripped = preg_replace('/[\x00-\x20\x7F]+/', '', trim($value)) ?? '';
        $decoded = html_entity_decode($stripped, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $decoded = preg_replace('/[\x00-\x20\x7F]+/', '', $decoded) ?? '';
        $decoded = html_entity_decode($decoded, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return preg_replace('/[\x00-\x20\x7F]+/', '', $decoded) ?? '';
    }

    private static function styleNeedsCleaning(string $value): bool
    {
        return (bool) preg_match('/expression\s*\(|url\s*\(|javascript\s*:|vbscript\s*:|-moz-binding|behavior\s*:/i', $value);
    }

    private static function rebuild(DOMDocument $source): string
    {
        $clean = new DOMDocument;
        $container = $clean->appendChild($clean->createElement('div'));

        if (! $container instanceof DOMElement) {
            return '';
        }

        $body = $source->getElementsByTagName('body')->item(0);

        if ($body instanceof DOMElement) {
            self::rebuildChildren($body, $container);
        }

        return self::innerHtml($container);
    }

    private static function rebuildChildren(DOMNode $source, DOMElement $target): void
    {
        foreach ($source->childNodes as $child) {
            if (! $child instanceof DOMElement) {
                if ($child->nodeType === XML_TEXT_NODE) {
                    $target->appendChild($target->ownerDocument->createTextNode((string) $child->textContent));
                }

                continue;
            }

            if (self::shouldDrop($child)) {
                continue;
            }

            $tag = strtolower($child->tagName);

            if (! in_array($tag, self::ALLOWED_TAGS, true)) {
                self::rebuildChildren($child, $target);

                continue;
            }

            $element = $target->ownerDocument->createElement($tag);
            self::copySafeAttributes($child, $element);

            if ($tag === 'iframe' && ! self::isHttpsUrl($element->getAttribute('src'))) {
                continue;
            }

            self::rebuildChildren($child, $element);
            $target->appendChild($element);
        }
    }

    private static function shouldDrop(DOMElement $element): bool
    {
        $tag = strtolower($element->tagName);

        if ($tag === 'iframe') {
            return ! self::isHttpsUrl($element->getAttribute('src'));
        }

        if ($tag === 'meta') {
            return strtolower($element->getAttribute('http-equiv')) !== '';
        }

        return in_array($tag, self::DROPPED_TAGS, true);
    }

    private static function copySafeAttributes(DOMElement $from, DOMElement $to): void
    {
        $tag = strtolower($from->tagName);

        foreach (self::attributes($from) as $attribute) {
            $name = strtolower($attribute->name);

            if (str_starts_with($name, 'on') || $name === 'srcdoc') {
                continue;
            }

            if ($name === 'style' && self::styleNeedsCleaning($attribute->value)) {
                continue;
            }

            if (self::attributeValueIsDangerous($name, $attribute->value, $tag)) {
                continue;
            }

            $to->setAttribute($attribute->name, $attribute->value);
        }
    }

    /**
     * @return list<DOMAttr>
     */
    private static function attributes(DOMElement $element): array
    {
        $attributes = [];

        foreach ($element->attributes as $attribute) {
            $attributes[] = $attribute;
        }

        return $attributes;
    }

    private static function innerHtml(DOMElement $element): string
    {
        $html = '';

        foreach ($element->childNodes as $child) {
            $saved = $element->ownerDocument->saveHTML($child);

            if (is_string($saved)) {
                $html .= $saved;
            }
        }

        return $html;
    }

    private static function escape(string $html): string
    {
        return htmlspecialchars($html, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
