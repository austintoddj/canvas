<?php

use Canvas\Models\Post;
use Canvas\Models\PostRevision;
use Canvas\Support\PostBody;
use Illuminate\Support\Facades\DB;

$youtube = '<div data-youtube-video=""><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0" class="canvas-post-body-youtube-iframe" title="YouTube video" width="640" height="360" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen="true" referrerpolicy="strict-origin-when-cross-origin" frameborder="0"></iframe></div>';

$vimeo = '<div data-canvas-iframe="" data-src="https://player.vimeo.com/video/22439234" data-layout="video" class="canvas-post-body-iframe canvas-post-body-iframe--video"><iframe src="https://player.vimeo.com/video/22439234" title="Embedded content" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></div>';

it('leaves editor html unchanged', function () use ($youtube, $vimeo): void {
    $samples = [
        null,
        '',
        'Plain paragraph without tags.',
        '<p>Hello &amp; welcome</p>',
        '<p style="text-align: center">Centered</p>',
        '<p><a href="https://example.com/post" class="text-blue-600">Link</a> and <a href="mailto:editor@example.com">mail</a></p>',
        '<img src="/storage/media/photo.png" class="canvas-post-body-image" alt="Photo">',
        '<img src="https://images.unsplash.com/photo-1" alt="Unsplash">',
        '<img src="/storage/a.png" />',
        '<img alt="a/b path" src="https://images.unsplash.com/photo-1">',
        '<p>src/Support/PostBody.php</p>',
        '<p>The word onerror= is text</p>',
        '<!-- note --><p>Hi</p>',
        '<br/>',
        $youtube,
        $vimeo,
    ];

    foreach ($samples as $sample) {
        expect(PostBody::clean($sample))->toBe($sample);
    }
});

it('strips unsafe iframes, scripts, and event handlers', function (): void {
    // Regression: GHSA-8xqp-qv6c-p5r8 — iframe scheme was only checked on editor insert
    $clean = PostBody::clean('<p>Visible</p><div data-canvas-iframe="" data-src="javascript:0"><iframe src="javascript:0"></iframe></div>');

    expect($clean)->toContain('Visible')
        ->and($clean)->not->toContain('javascript:');

    $srcdoc = PostBody::clean('<iframe src="https://player.vimeo.com/video/22439234" srcdoc="<script>1</script>"></iframe>');

    expect($srcdoc)->toContain('https://player.vimeo.com/video/22439234')
        ->and($srcdoc)->not->toContain('srcdoc')
        ->and($srcdoc)->not->toContain('<script');

    $handlers = PostBody::clean('<p onclick="alert(1)">Hi</p><img src="/storage/a.png" onerror="alert(1)" alt="A"><a href="javascript:0">click</a>');

    expect($handlers)->toContain('Hi')
        ->and($handlers)->toContain('/storage/a.png')
        ->and($handlers)->not->toContain('onclick')
        ->and($handlers)->not->toContain('onerror')
        ->and($handlers)->not->toContain('javascript:');

    $entity = PostBody::clean('<iframe src="java&#115;cript:0"></iframe><p>Keep</p>');

    expect($entity)->toContain('Keep')
        ->and($entity)->not->toContain('javascript:')
        ->and($entity)->not->toContain('cript:');

    expect(PostBody::clean($clean))->toBe($clean)
        ->and(PostBody::clean($srcdoc))->toBe($srcdoc)
        ->and(PostBody::clean($handlers))->toBe($handlers);
});

it('does not keep event handlers hidden by a solidus or an abrupt comment', function (): void {
    // Regression: GHSA-rwxv-634g-pw9j — libxml2 2.9 stops a start tag at "/" and
    // leaves "<!-->" open, then the old cleaner stored that original string.
    $payloads = [
        '<p>Keep</p><img src="x"/onerror=alert(1)>',
        '<img/src="x"/onerror=alert(1)>',
        '<img/onerror=alert(1) src=x>',
        '<img src="x" /onerror=alert(1)>',
        '<img src="x" / onerror=alert(1)>',
        '<img src="x"/ onerror=alert(1)>',
        '<img alt="a > b" src="x"/onerror=alert(1)>',
        "<img src=\"x\"\n/onerror=alert(1)>",
        '<IMG SRC="x"/ONERROR=alert(1)>',
        '<a/href="javascript:alert(1)">x</a>',
        '<details/open/ontoggle=alert(1)>',
        '<input/autofocus/onfocus=alert(1)>',
        '<svg/onload=alert(1)>',
        '<!--><img src=x onerror=alert(1)>-->',
        '<p>Keep</p><!--><img src=x onerror=alert(1)>-->',
        '<!--><img src=x onerror=alert(1)>',
        '<!---> <img src=x onerror=alert(1)>',
    ];

    $returnable = new ReflectionMethod(PostBody::class, 'rawHtmlIsReturnable');

    foreach ($payloads as $payload) {
        $clean = PostBody::clean($payload);

        expect($returnable->invoke(null, $payload))->toBeFalse()
            ->and($clean)->not->toMatch('/on[a-z0-9:-]*\s*=/i')
            ->and(strtolower((string) $clean))->not->toContain('javascript:')
            ->and(PostBody::clean($clean))->toBe($clean);
    }

    expect(PostBody::clean('<p>Keep</p><img src="x"/onerror=alert(1)>'))->toContain('Keep')
        ->and(PostBody::clean('<p>Keep</p><!--><img src=x onerror=alert(1)>-->'))->toContain('Keep');
});

it('strips a stored solidus event handler on read and on the next save', function (): void {
    // Regression: GHSA-rwxv-634g-pw9j — already published posts are cleaned on read.
    $payload = '<p>Visible</p><img src="x"/onerror=alert(1)>';

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'body' => '<p>Visible</p>',
    ]);

    DB::table('canvas_posts')->where('id', $post->id)->update(['body' => $payload]);
    $post->refresh();

    expect($post->body)->toContain('Visible')
        ->and($post->body)->not->toMatch('/onerror/i')
        ->and($post->getRawOriginal('body'))->toBe($payload);

    $post->pending = ['body' => $payload];
    $post->body = $payload;
    $post->save();

    $fresh = $post->fresh();

    expect($fresh)->not->toBeNull()
        ->and($fresh->getRawOriginal('body'))->not->toMatch('/onerror/i')
        ->and($fresh->pending['body'])->not->toMatch('/onerror/i');
});

it('cleans stored post and pending bodies on read and write', function (): void {
    $payload = '<p>Visible</p><iframe src="javascript:0"></iframe>';

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'body' => '<p>Visible</p>',
    ]);

    DB::table('canvas_posts')->where('id', $post->id)->update(['body' => $payload]);

    $post->refresh();

    expect($post->body)->toContain('Visible')
        ->and($post->body)->not->toContain('javascript:')
        ->and($post->getRawOriginal('body'))->toBe($payload);

    $post->body = $payload;
    $post->pending = [
        'title' => 'Pending',
        'body' => $payload,
    ];
    $post->save();

    $fresh = $post->fresh();

    expect($fresh)->not->toBeNull()
        ->and($fresh->getRawOriginal('body'))->not->toContain('javascript:')
        ->and($fresh->pending)->toBeArray()
        ->and($fresh->pending['body'])->not->toContain('javascript:')
        ->and($fresh->pending['title'])->toBe('Pending');

    $revision = PostRevision::factory()->create([
        'post_id' => $post->id,
        'user_id' => $this->admin->id,
        'body' => '<p>Visible</p>',
    ]);

    DB::table('canvas_post_revisions')->where('id', $revision->id)->update(['body' => $payload]);

    expect($revision->fresh()->body)->not->toContain('javascript:');
});
