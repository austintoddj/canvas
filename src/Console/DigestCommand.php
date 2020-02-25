<?php

namespace Canvas\Console;

use Canvas\Mail\WeeklyDigest;
use Canvas\Post;
use Canvas\UserMeta;
use Canvas\View;
use Canvas\Visit;
use Exception;
use Illuminate\Console\Command;
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
    protected $description = 'Send the weekly email digest';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        // Get all the users who have authored content
        $recipients = User::whereIn('id', Post::all()->pluck('user_id')->unique())->get();

        foreach ($recipients as $user) {

            // Verify that the user has enabled emails
            if (UserMeta::where('user_id', $user->id)->pluck('digest')->first()) {
                // Gather the post IDs for a given user
                $post_ids = Post::where('user_id', $user->id)->published()->pluck('id');

                // Compile tracking data for a user's posts
                $data = collect($this->compileTrackingData($post_ids->toArray(), 7));

                // Get the email of the user to notify
                $data->put('email', $user->email);

                // Get the weekly digest date ranges
                $data->put('start_date', now()->subDays(7)->format('M d'));
                $data->put('end_date', now()->format('M d'));

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
    private function compileTrackingData(array $post_ids, int $days): array
    {
        $data = collect();
        $postData = collect();

        foreach ($post_ids as $post_id) {
            $views = View::select('created_at')
                         ->where('post_id', $post_id)
                         ->whereBetween('created_at', [
                             today()->subDays($days)->startOfDay()->toDateTimeString(),
                             today()->endOfDay()->toDateTimeString(),
                         ])->get();

            $visits = Visit::select('created_at')
                           ->where('post_id', $post_id)
                           ->whereBetween('created_at', [
                               today()->subDays($days)->startOfDay()->toDateTimeString(),
                               today()->endOfDay()->toDateTimeString(),
                           ])->get();

            // Only collect view data if any is available
            if (array_sum([$views->count(), $visits->count()]) > 0) {
                $post = Post::find($post_id);
                $postData->put($post->id, [
                    'title' => $post->title,
                    'views' => $views->count(),
                    'visits' => $visits->count(),
                ]);
            }
        }

        $data->put('posts', $postData);

        // Find the views belonging to a user for a given number of days
        $viewCountForMonth = View::select('created_at')
                                 ->whereIn('post_id', $post_ids)
                                 ->whereBetween('created_at', [
                                     today()->subDays($days)->startOfDay()->toDateTimeString(),
                                     today()->endOfDay()->toDateTimeString(),
                                 ])
                                 ->count();

        $visitCountForMonth = Visit::select('created_at')
                                   ->whereIn('post_id', $post_ids)
                                   ->whereBetween('created_at', [
                                       today()->subDays($days)->startOfDay()->toDateTimeString(),
                                       now()->endOfDay()->toDateTimeString(),
                                   ])
                                   ->count();

        $data->put('total_views', $viewCountForMonth);
        $data->put('total_visits', $visitCountForMonth);

        return $data->toArray();
    }
}
