<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\DestroyMediaRequest;
use Canvas\Http\Requests\StoreMediaRequest;
use Canvas\Http\Requests\UpdateMediaRequest;
use Canvas\Models\Media;
use Canvas\Support\MediaService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class MediaController extends Controller
{
    public function __construct(
        private readonly MediaService $mediaService,
    ) {}

    public function index(): JsonResponse
    {
        $user = request()->user(config('canvas.guard'));
        $canViewAll = Gate::forUser($user)->allows('viewAll', Media::class);

        $media = $this->visibleMediaQuery($user, $canViewAll)
            ->when(
                request()->filled('search'),
                fn (Builder $query) => $query->search((string) request()->query('search')),
            )
            ->when(
                request()->filled('mime'),
                fn (Builder $query) => $query->ofMimeType((string) request()->query('mime')),
            )
            ->latest()
            ->paginate();

        return response()->json($media, 200);
    }

    public function create(): JsonResponse
    {
        return response()->json(Media::query()->make([
            'id' => (string) Str::uuid(),
        ]), 200);
    }

    public function store(StoreMediaRequest $request, string $id): JsonResponse
    {
        $media = $this->mediaService->storeMediaUpload(
            $request->file('file'),
            $request->user(config('canvas.guard')),
            $id,
            $request->safe()->only(['alt', 'caption', 'original_name']),
        );

        return response()->json($media, 201);
    }

    public function show(Media $media): JsonResponse
    {
        $this->ensureMediaIsVisibleToCurrentUser($media);

        return response()->json($media, 200);
    }

    public function update(UpdateMediaRequest $request, Media $media): JsonResponse
    {
        $media->fill($request->validated());
        $media->save();

        return response()->json($media->refresh(), 200);
    }

    public function destroy(DestroyMediaRequest $request, Media $media): Response
    {
        $this->mediaService->destroy($media);

        return response()->noContent();
    }

    private function ensureMediaIsVisibleToCurrentUser(Media $media): void
    {
        if (Gate::forUser(request()->user(config('canvas.guard')))->denies('view', $media)) {
            throw (new ModelNotFoundException)->setModel(Media::class, [$media->getKey()]);
        }
    }

    /**
     * @return Builder<Media>
     */
    private function visibleMediaQuery(mixed $user, bool $canViewAll): Builder
    {
        return Media::query()->when(
            ! $canViewAll || request()->query('scope', 'user') !== 'all',
            fn (Builder $query) => $query->where('user_id', data_get($user, 'id')),
        );
    }
}
