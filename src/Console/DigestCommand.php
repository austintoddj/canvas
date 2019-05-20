<?php

namespace Canvas\Console;

use Exception;
use Canvas\Post;
use Canvas\View;
use Canvas\Mail\WeeklyDigest;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Mail;

class DigestCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'canvas:digest';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an e-mail digest of Canvas statistics';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        // Get all the users who have authored content
        $users = $this->gatherUsers();

        if ($users->isNotEmpty()) {
            foreach ($users as $user) {

                // Gather the post IDs for a given user
                $post_ids = Post::where('user_id', $user->id)->pluck('id');

                // Compile the view count data for a users posts
                $data = collect($this->compileViewData($post_ids->toArray(), 7));

                // Get the email of the user to notify
                $data->put('email', $user->email);

                // Get the summary date ranges
                $data->put('start_date', now()->subDays(7)->format('M d'));
                $data->put('end_date', now()->format('M d, Y'));

                try {
                    Mail::send(new WeeklyDigest($data->toArray()));
                } catch (Exception $exception) {
                    logger()->error($exception->getMessage());
                }
            }
        }
    }

    /**
     * Return the view count data for posts given a number of days.
     *
     * @param array $post_ids
     * @param int $days
     * @return array
     */
    private function compileViewData(array $post_ids, int $days): array
    {
        $data = collect();
        $post_data = collect();

        foreach ($post_ids as $post_id) {

            // Get the post view count for a given number of days
            $post_views = View::whereBetween('created_at', [
                now()->subDays($days)->toDateTimeString(),
                now()->toDateTimeString(),
            ])->where('post_id', $post_id)->count();

            // Only collect view data if there is any
            if ($post_views) {
                $post = Post::find($post_id);
                $post_data->put($post->title, $post_views);
            }
        }

        $data->put('posts', $post_data);

        // Find the views belonging to a user for a given number of days
        $views = View::whereBetween('created_at', [
            now()->subDays($days)->toDateTimeString(),
            now()->toDateTimeString(),
        ])->whereIn('post_id', $post_ids)
            ->select('created_at')->get();

        $data->put('total_views', $views->count());

        return $data->toArray();
    }

    /**
     * Get users who have authored content.
     *
     * @return Collection
     */
    private function gatherUsers(): Collection
    {
        return User::whereIn('id', Post::all()->pluck('user_id')->unique())->get();
    }
}
