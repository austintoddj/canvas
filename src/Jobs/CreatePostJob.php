<?php

namespace Canvas\Jobs;

use Exception;
use Illuminate\Bus\Queueable;
use Canvas\Interfaces\PostInterface;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class CreatePostJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 1;

    /**
     * @var array
     */
    public $request = [];

    /**
     * Create a new job instance.
     *
     * @param array $request
     */
    public function __construct(array $request = [])
    {
        $this->request = $request;
    }

    /**
     * Execute the job.
     *
     * @return void
     * @throws Exception
     */
    public function handle()
    {
        $post = app(PostInterface::class)->create([
            'user_id'      => auth()->user()->id,
            'title'        => $this->request['title'],
            'summary'      => $this->request['summary'],
            'body'         => $this->request['body'],
            'slug'         => str_slug($this->request['title']),
            'published_at' => $this->request['published_at'],
        ]);
        $post->save();
        $post->tags()->sync($this->request['tags']);
    }
}
