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
 * A document is safe only when libxml2 and a browser would both see no
 * dangerous tags or attributes. Otherwise the stored value is the rebuilt tree.
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

        if (! self::documentNeedsCleaning($document) && self::rawHtmlIsReturnable($html)) {
            return $html;
        }

        $clean = self::rebuild($document);

        if ($clean === '') {
            return '';
        }

        $again = self::load($clean);

        if (! $again instanceof DOMDocument || self::documentNeedsCleaning($again) || ! self::rawHtmlIsReturnable($clean)) {
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

    /**
     * Some libxml2 builds stop reading a start tag at a solidus, and they keep
     * an abruptly closed comment open. Browsers do neither. Returning the
     * original string in those cases stores the handlers libxml never saw.
     */
    private static function rawHtmlIsReturnable(string $html): bool
    {
        if (str_contains($html, "\0") || str_contains($html, '<?') || str_contains($html, '<![')) {
            return false;
        }

        $length = strlen($html);
        $i = 0;

        while ($i < $length) {
            $lt = strpos($html, '<', $i);

            if ($lt === false) {
                return true;
            }

            $i = $lt + 1;

            if ($i >= $length) {
                return true;
            }

            $character = $html[$i];

            if ($character === '!') {
                if (! self::consumeDeclaration($html, $i)) {
                    return false;
                }

                continue;
            }

            if ($character === '?') {
                return false;
            }

            if ($character === '/') {
                $end = strpos($html, '>', $i);

                if ($end === false) {
                    return false;
                }

                $i = $end + 1;

                continue;
            }

            if (! self::isNameStart($character)) {
                continue;
            }

            if (! self::consumeStartTag($html, $i)) {
                return false;
            }
        }

        return true;
    }

    private static function consumeDeclaration(string $html, int &$i): bool
    {
        $length = strlen($html);
        $next = $i + 1;

        if ($next + 1 < $length && $html[$next] === '-' && $html[$next + 1] === '-') {
            $i = $next + 2;

            if ($i < $length && $html[$i] === '>') {
                return false;
            }

            if ($i + 1 < $length && $html[$i] === '-' && $html[$i + 1] === '>') {
                return false;
            }

            $end = strpos($html, '-->', $i);

            if ($end === false) {
                $i = $length;

                return true;
            }

            $i = $end + 3;

            return true;
        }

        return false;
    }

    private static function consumeStartTag(string $html, int &$i): bool
    {
        $length = strlen($html);
        $start = $i;

        while ($i < $length) {
            $character = $html[$i];

            if (self::isWhitespace($character) || $character === '/' || $character === '>' || $character === '=') {
                break;
            }

            $i++;
        }

        $tag = strtolower(substr($html, $start, $i - $start));

        if ($tag === '' || ($tag !== 'meta' && in_array($tag, self::DROPPED_TAGS, true))) {
            return false;
        }

        $iframeSrc = null;
        $closed = false;

        while ($i < $length) {
            while ($i < $length && self::isWhitespace($html[$i])) {
                $i++;
            }

            if ($i >= $length) {
                return false;
            }

            $character = $html[$i];

            if ($character === '>') {
                $i++;
                $closed = true;

                break;
            }

            if ($character === '/') {
                if ($i + 1 < $length && $html[$i + 1] === '>') {
                    $i += 2;
                    $closed = true;

                    break;
                }

                return false;
            }

            $nameStart = $i;

            while ($i < $length) {
                $character = $html[$i];

                if (self::isWhitespace($character) || $character === '/' || $character === '=' || $character === '>') {
                    break;
                }

                $i++;
            }

            $name = strtolower(substr($html, $nameStart, $i - $nameStart));

            if ($name === '' || str_starts_with($name, 'on') || $name === 'srcdoc') {
                return false;
            }

            while ($i < $length && self::isWhitespace($html[$i])) {
                $i++;
            }

            $value = '';

            if ($i < $length && $html[$i] === '=') {
                $i++;

                while ($i < $length && self::isWhitespace($html[$i])) {
                    $i++;
                }

                if ($i >= $length) {
                    return false;
                }

                $quote = $html[$i];

                if ($quote === '"' || $quote === "'") {
                    $i++;
                    $valueStart = $i;
                    $end = strpos($html, $quote, $i);

                    if ($end === false) {
                        return false;
                    }

                    $value = substr($html, $valueStart, $end - $valueStart);
                    $i = $end + 1;
                } else {
                    $valueStart = $i;

                    while ($i < $length && ! self::isWhitespace($html[$i]) && $html[$i] !== '>') {
                        $i++;
                    }

                    $value = substr($html, $valueStart, $i - $valueStart);
                }
            }

            if ($name === 'style' && self::styleNeedsCleaning($value)) {
                return false;
            }

            if (self::attributeValueIsDangerous($name, $value, $tag)) {
                return false;
            }

            if ($tag === 'iframe' && $name === 'src') {
                $iframeSrc = $value;
            }

            if ($tag === 'meta' && $name === 'http-equiv' && strtolower($value) !== '') {
                return false;
            }
        }

        if (! $closed) {
            return false;
        }

        return $tag !== 'iframe' || self::isHttpsUrl((string) $iframeSrc);
    }

    private static function isNameStart(string $character): bool
    {
        return ($character >= 'A' && $character <= 'Z') || ($character >= 'a' && $character <= 'z');
    }

    private static function isWhitespace(string $character): bool
    {
        return $character === ' ' || $character === "\n" || $character === "\r" || $character === "\t" || $character === "\f";
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
