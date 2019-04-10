<?php

namespace Canvas;

use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Storage;

class Exporter
{
    /**
     * The user to export data for.
     *
     * @var User
     */
    protected $user;

    /**
     * The path to the temporary file.
     *
     * @var string
     */
    protected $file;

    /**
     * Assign a user to export data for.
     *
     * @param User $user
     * @return Exporter
     */
    public function forUser(User $user): self
    {
        $this->user = $user;

        return $this;
    }

    /**
     * Compile and save a JSON file to storage.
     *
     * @param string $disk
     * @return Exporter
     */
    public function exportTo(string $disk)
    {
        $data = collect([
            'meta' => [
                'exported_on' => now()->timestamp,
            ],

            'data' => [
                'posts'       => $this->gatherPostData(),
                'tags'        => $this->gatherTagData(),
                'post_tags'   => $this->gatherPostTagData(),
                'post_topics' => $this->gatherPostTopicData(),
                'views'       => $this->gatherViewData(),
                'user'        => $this->gatherUserData(),
            ],
        ])->toJson(JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

        $this->file = sprintf('%s/%s/%s_export.json', config('canvas.storage_path'), 'exports', time());

        Storage::disk($disk)->put($this->file, $data);

        return $this;
    }

    /**
     * Download a file from storage.
     *
     * @return Exporter
     */
    public function download()
    {
        resolve(Downloader::class)->run($this->file);

        Storage::disk(config('canvas.storage_disk'))->delete($this->file);

        return $this;
    }

    /**
     * Gather shared posts for a user.
     *
     * @return array
     */
    private function gatherPostData(): array
    {
        $data = collect();

        $posts = Post::where('user_id', $this->user->id);

        $posts->each(function ($post) use ($data) {
            $data->push($post);
        });

        return $data->toArray();
    }

    /**
     * Gather all of the tags.
     *
     * @return array
     */
    private function gatherTagData(): array
    {
        $data = collect();

        $tags = Tag::all(['id', 'slug', 'name']);

        $tags->each(function ($value) use ($data) {
            $data->push($value);
        });

        return $data->toArray();
    }

    /**
     * Gather the post/tag relationships.
     *
     * @return array
     */
    private function gatherPostTagData(): array
    {
        $data = collect();

        $post_tags = PostTags::all();

        $post_tags->each(function ($value) use ($data) {
            $data->push($value);
        });

        return $data->toArray();
    }

    /**
     * Gather the post/topic relationships.
     *
     * @return array
     */
    private function gatherPostTopicData(): array
    {
        $data = collect();

        $post_topics = PostsTopics::all();

        $post_topics->each(function ($value) use ($data) {
            $data->push($value);
        });

        return $data->toArray();
    }

    /**
     * Gather the view data for a user.
     *
     * @return array
     */
    private function gatherViewData(): array
    {
        return [];
    }

    /**
     * Gather the user data.
     *
     * @return array
     */
    private function gatherUserData(): array
    {
        return collect([
            'id'         => $this->user->id,
            'name'       => $this->user->name,
            'email'      => $this->user->email,
            'created_at' => $this->user->created_at,
            'updated_at' => $this->user->updated_at,
        ])->toArray();
    }
}
