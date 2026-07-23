@php
    $metaTitle = $title ?? config('app.name');
    $metaDescription = $description ?? '';
    $metaUrl = $url ?? url()->current();
    $metaType = $type ?? 'website';
    $metaImage = $image ?? null;
    $metaImageAlt = $imageAlt ?? $metaTitle;
    $metaSiteName = config('app.name');
    $twitterCard = filled($metaImage) ? 'summary_large_image' : 'summary';
@endphp

@if (filled($metaDescription))
    <meta name="description" content="{{ $metaDescription }}">
@endif

<link rel="canonical" href="{{ $metaUrl }}">

<meta property="og:type" content="{{ $metaType }}">
<meta property="og:site_name" content="{{ $metaSiteName }}">
<meta property="og:title" content="{{ $metaTitle }}">
@if (filled($metaDescription))
    <meta property="og:description" content="{{ $metaDescription }}">
@endif
<meta property="og:url" content="{{ $metaUrl }}">
@if (filled($metaImage))
    <meta property="og:image" content="{{ $metaImage }}">
    <meta property="og:image:alt" content="{{ $metaImageAlt }}">
@endif

@if ($metaType === 'article')
    @if (! empty($publishedTime))
        <meta property="article:published_time" content="{{ $publishedTime }}">
    @endif
    @if (! empty($modifiedTime))
        <meta property="article:modified_time" content="{{ $modifiedTime }}">
    @endif
@endif

<meta name="twitter:card" content="{{ $twitterCard }}">
<meta name="twitter:title" content="{{ $metaTitle }}">
@if (filled($metaDescription))
    <meta name="twitter:description" content="{{ $metaDescription }}">
@endif
@if (filled($metaImage))
    <meta name="twitter:image" content="{{ $metaImage }}">
@endif

@if (! empty($jsonLd) && is_array($jsonLd))
    <script type="application/ld+json">{!! json_encode($jsonLd, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!}</script>
@endif
