<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\AttachMediaTagRequest;
use Canvas\Http\Requests\DestroyMediaTagRequest;
use Canvas\Http\Requests\StoreMediaTagRequest;
use Canvas\Models\Media;
use Canvas\Models\MediaTag;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class MediaTagController extends Controller
{
    public function index(): JsonResponse
    {
        $user = request()->user(config('canvas.guard'));
        $canViewAll = Gate::forUser($user)->allows('viewAll', Media::class);
        $visibleMedia = fn (Builder $query): Builder => $this->constrainVisibleMedia($query, $user, $canViewAll);

        $total = MediaTag::query()->count();

        $tags = MediaTag::query()
            ->orderBy('name')
            ->withCount(['media as media_count' => $visibleMedia])
            ->limit(200)
            ->get();

        return response()->json([
            'data' => $tags->map(fn (MediaTag $tag): array => $this->tagPayload($tag, includeCount: true))->values()->all(),
            'meta' => [
                'all_count' => $this->visibleMediaQuery($user, $canViewAll)->count(),
                'untagged_count' => $this->visibleMediaQuery($user, $canViewAll)->whereDoesntHave('mediaTags')->count(),
                'truncated' => $total >= 200,
            ],
        ], 200);
    }

    public function create(): JsonResponse
    {
        return response()->json([
            'id' => (string) Str::uuid(),
        ], 200);
    }

    public function store(StoreMediaTagRequest $request, string $id): JsonResponse
    {
        $name = (string) $request->validated('name');
        $slug = MediaTag::slugFor($name);
        $user = $request->user(config('canvas.guard'));

        $tag = MediaTag::query()->find($id);
        $created = $tag === null;

        if (! $tag) {
            if ($tag = MediaTag::onlyTrashed()->firstWhere('slug', $slug)) {
                $tag->restore();
                $tag->fill([
                    'name' => $name,
                    'slug' => $slug,
                ]);
                $tag->save();

                return response()->json($this->tagPayload($tag->refresh()), 201);
            }

            $tag = new MediaTag(['id' => $id]);
        }

        $tag->fill([
            'name' => $name,
            'slug' => $slug,
        ]);
        $tag->user_id = $tag->user_id ?? data_get($user, 'id');
        $tag->save();

        return response()->json($this->tagPayload($tag->refresh()), $created ? 201 : 200);
    }

    public function destroy(DestroyMediaTagRequest $request, MediaTag $mediaTag): Response
    {
        $mediaTag->delete();

        return response()->noContent();
    }

    public function attach(AttachMediaTagRequest $request, MediaTag $mediaTag): JsonResponse
    {
        return $this->mutateMembership($request, $mediaTag, attach: true);
    }

    public function detach(AttachMediaTagRequest $request, MediaTag $mediaTag): JsonResponse
    {
        return $this->mutateMembership($request, $mediaTag, attach: false);
    }

    private function mutateMembership(AttachMediaTagRequest $request, MediaTag $mediaTag, bool $attach): JsonResponse
    {
        /** @var list<string> $ids */
        $ids = array_values($request->validated('media_ids'));
        $user = $request->user(config('canvas.guard'));
        $matched = [];
        $skipped = [];

        foreach ($ids as $id) {
            $media = Media::query()->find($id);

            if ($media === null || Gate::forUser($user)->denies('update', $media)) {
                $skipped[] = $id;

                continue;
            }

            if ($attach) {
                try {
                    $mediaTag->media()->syncWithoutDetaching([$id]);
                } catch (UniqueConstraintViolationException) {
                    // Concurrent attach of the same pair is success.
                }
            } else {
                $mediaTag->media()->detach([$id]);
            }

            $matched[] = $id;
        }

        $key = $attach ? 'attached' : 'detached';

        return response()->json([
            $key => $matched,
            'skipped' => $skipped,
            'media_count' => $this->visibleMediaCount($mediaTag, $user),
        ], 200);
    }

    /**
     * @return array{id: string, name: string, media_count?: int, created_at: string|null}
     */
    private function tagPayload(MediaTag $tag, bool $includeCount = true): array
    {
        $payload = [
            'id' => (string) $tag->id,
            'name' => (string) $tag->name,
            'created_at' => $tag->created_at?->toJSON(),
        ];

        if ($includeCount) {
            $payload['media_count'] = isset($tag->media_count)
                ? (int) $tag->media_count
                : $this->visibleMediaCount($tag, request()->user(config('canvas.guard')));
        }

        return $payload;
    }

    private function visibleMediaCount(MediaTag $tag, mixed $user): int
    {
        $canViewAll = Gate::forUser($user)->allows('viewAll', Media::class);

        return $tag->media()
            ->when(
                ! $canViewAll || request()->query('scope', 'user') !== 'all',
                fn (Builder $query) => $query->where('canvas_media.user_id', data_get($user, 'id')),
            )
            ->count();
    }

    /**
     * @param  Builder<Media>  $query
     * @return Builder<Media>
     */
    private function constrainVisibleMedia(Builder $query, mixed $user, bool $canViewAll): Builder
    {
        return $query->when(
            ! $canViewAll || request()->query('scope', 'user') !== 'all',
            fn (Builder $builder) => $builder->where('canvas_media.user_id', data_get($user, 'id')),
        );
    }

    /**
     * @return Builder<Media>
     */
    private function visibleMediaQuery(mixed $user, bool $canViewAll): Builder
    {
        return $this->constrainVisibleMedia(Media::query(), $user, $canViewAll);
    }
}
