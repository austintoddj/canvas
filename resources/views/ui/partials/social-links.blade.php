@php
    $links = $canvasUser?->socialLinks() ?? [];
@endphp

@if (filled($links))
    <div class="flex flex-wrap gap-3 mt-3">
        @foreach ($links as $platform => $handle)
            @if (filled($handle))
                @php
                    $href = filter_var($handle, FILTER_VALIDATE_URL)
                        ? $handle
                        : match ($platform) {
                            'twitter', 'x' => "https://twitter.com/{$handle}",
                            'github' => "https://github.com/{$handle}",
                            'linkedin' => "https://linkedin.com/in/{$handle}",
                            'instagram' => "https://instagram.com/{$handle}",
                            default => null,
                        };
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