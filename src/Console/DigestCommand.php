<?php

namespace Canvas\Console;

use Canvas\Mail\WeeklyDigest;
use Canvas\Post;
use Canvas\Tracker;
use Canvas\UserMeta;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Mail;

class DigestCommand extends Command
{
    use Tracker;

    /**
     * Number of days to see stats for.
     *
     * @const int
     */
    private const DAYS = 7;

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
        $recipients = User::whereIn('id', Post::published()->pluck('user_id')->unique())->get();

        foreach ($recipients as $user) {
            if ($this->userHasEnabledMail($user)) {
                $postIDs = Post::where('user_id', $user->id)->published()->pluck('id');

                $data = collect($this->getTrackedDataForPosts($postIDs->toArray(), self::DAYS));

                try {
                    Mail::to($user->email)->send(new WeeklyDigest($data->toArray()));
                } catch (Exception $exception) {
                    logger()->error($exception->getMessage());
                }
            }
        }
    }

    /**
     * Return true if the user enabled mail.
     *
     * @param User $user
     * @return bool
     */
    private function userHasEnabledMail(User $user): bool
    {
        return (bool) UserMeta::where('user_id', $user->id)->pluck('digest')->first();
    }
}
