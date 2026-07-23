@if ($user)
    @php
        $canvasUser = $user->relationLoaded('canvasUser') ? $user->getRelation('canvasUser') : null;
        $avatarUrl = \Canvas\Support\AuthorAvatar::url($canvasUser?->avatar);
        $size = $size ?? 32;
        $initials = collect(preg_split('/\s+/', trim((string) $user->name) ?: '') ?: [])
            ->filter()
            ->take(2)
            ->map(fn (string $part) => mb_strtoupper(mb_substr($part, 0, 1)))
            ->implode('');
        if ($initials === '') {
            $initials = '?';
        }
    @endphp
    <div @class(['flex items-center gap-2 text-sm text-gray-500', $wrapperClass ?? null])>
        @if ($avatarUrl)
            <img src="{{ $avatarUrl }}"
                 alt="{{ $user->name }}"
                 @class(['rounded-full object-cover', $imageClass ?? 'w-6 h-6'])
                 loading="lazy"
                 decoding="async">
        @else
            <span @class([
                'inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-medium',
                $imageClass ?? 'w-6 h-6 text-[10px]',
            ]) aria-hidden="true">{{ $initials }}</span>
        @endif
        @if ($canvasUser?->username)
            <a href="{{ route('canvas-ui.author', $canvasUser->username) }}"
               @class(['hover:underline', $linkClass ?? null])>
                {{ $user->name }}
            </a>
        @else
            <span @class($linkClass ?? null)>{{ $user->name }}</span>
        @endif
    </div>
@endif
