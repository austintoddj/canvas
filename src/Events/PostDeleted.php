<?php

declare(strict_types=1);

namespace Canvas\Events;

use Canvas\Models\Post;
use Canvas\Support\ContentLocales;

final class PostDeleted
{
    public readonly ?string $locale;

    public function __construct(
        public readonly Post $post,
    ) {
        $this->locale = ContentLocales::enabled() ? $post->contentLocale() : null;
    }
}
