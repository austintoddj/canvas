<?=
'<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL
?>
<rss version="2.0">
    <channel>
        <title><![CDATA[ {{ url("/") }} ]]></title>
        <link><![CDATA[ {{ url("/feed") }} ]]></link>
        <description><![CDATA[ {{ config("canvas.description") }} ]]>
        </description>
        <language>{{ app()->getLocale() }}</language>
        <pubDate>{{ now() }}</pubDate>
        <lastBuildDate>{{ now() }}</lastBuildDate>
        @foreach($posts as $post)
            <item>
                <title><![CDATA[{{ $post->title }}]]></title>
                <link>{{ url($post->slug) }}</link>
                <description><![CDATA[{!! $post->summary !!}]]></description>
                <author><![CDATA[ {{ $post->user->name }} ]]></author>
                <guid>{{ $post->id }}</guid>
                <pubDate>{{ $post->published_at->toRssString() }}</pubDate>
            </item>
        @endforeach
    </channel>
</rss>
