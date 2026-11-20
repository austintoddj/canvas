<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Support\PostBody;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostTranslation extends Model
{
    protected $table = 'canvas_post_translations';

    /** @var list<string> */
    protected $guarded = ['id'];

    /** @var list<string> */
    protected $hidden = ['pending', 'published_notified_at'];

    /** @var array<string, string> */
    protected $casts = [
        'meta' => 'array',
        'pending' => 'array',
        'published_at' => 'datetime',
        'published_notified_at' => 'datetime',
    ];

    /** @return BelongsTo<Post, $this> */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /** @return Attribute<?string, ?string> */
    protected function body(): Attribute
    {
        return PostBody::eloquentAttribute();
    }
}
