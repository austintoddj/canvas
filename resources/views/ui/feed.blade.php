{!! '<'.'?xml version="1.0" encoding="UTF-8"?>' !!}
<rss version="2.0">
    <channel>
        <title>{{ $channelTitle }}</title>
        <link>{{ $channelLink }}</link>
        <description>{{ $channelDescription }}</description>
        <language>{{ $channelLanguage }}</language>
        @foreach ($posts as $post)
            @php
                $seo = \Canvas\Support\PostSeo::resolve($post, route('canvas-ui.show', $post->slug));
            @endphp
            <item>
                <title>{{ $seo['title'] }}</title>
                <link>{{ $seo['canonical_url'] }}</link>
                <guid isPermaLink="true">{{ route('canvas-ui.show', $post->slug) }}</guid>
                <pubDate>{{ $post->published_at->toRfc2822String() }}</pubDate>
                <description>{{ $seo['description'] }}</description>
            </item>
        @endforeach
    </channel>
</rss>
