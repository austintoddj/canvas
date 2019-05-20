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
        $compiled_data = $this->compileData();

        try {
            Mail::send(new WeeklyDigest());
        } catch (Exception $exception) {
            logger()->error($exception->getMessage());
        }
    }

    private function compileData()
    {
        $users = $this->gatherUsers();

        // Get views for the last [X] days
        $views = View::whereBetween('created_at', [
            now()->subDays(7)->toDateTimeString(),
            now()->toDateTimeString(),
        ])->select('created_at')->get();

        dd(array_sum(View::viewTrend($views, 7)));
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
