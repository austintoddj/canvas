@if ($user)
    @php
        $canvasUser = $user->relationLoaded('canvasUser') ? $user->getRelation('canvasUser') : null;
        $avatarUrl = \Canvas\Support\AuthorAvatar::url($canvasUser?->avatar, $user->email ?? '', $size ?? 32);
    @endphp
    <div @class(['flex items-center gap-2 text-sm text-gray-500', $wrapperClass ?? null])>
        <img src="{{ $avatarUrl }}"
             alt="{{ $user->name }}"
             @class(['rounded-full', $imageClass ?? 'w-6 h-6'])>
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
