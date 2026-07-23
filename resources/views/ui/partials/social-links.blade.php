@php
    use Canvas\Support\SocialProfiles;

    $links = $canvasUser?->socialLinks() ?? [];
@endphp

@if (filled($links))
    <div class="flex flex-wrap gap-3 mt-3">
        @foreach ($links as $platform => $handle)
            @if (filled($handle) && is_string($platform) && is_string($handle))
                @php
                    $href = SocialProfiles::profileUrl($platform, $handle)
                        ?? (filter_var($handle, FILTER_VALIDATE_URL) ? $handle : null);
                @endphp
                @if ($href)
                    <a href="{{ $href }}"
                       class="text-sm text-indigo-600 hover:underline capitalize"
                       rel="noopener noreferrer"
                       target="_blank">
                        {{ $platform }}
                    </a>
                @else
                    <span class="text-sm text-gray-500 capitalize">{{ $platform }}: {{ $handle }}</span>
                @endif
            @endif
        @endforeach
    </div>
@endif
